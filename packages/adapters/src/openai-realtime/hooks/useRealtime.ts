import { Model, ToolCall } from "@pocketcomputer/core";
import { useEffect, useRef, useState } from "react";

interface UseRealtimeOptions {
  tokenUrl: string;
  baseUrl?: string;
  model?: string;
  voice?: string;
  onReady?: (model: Model, dataChannel: RTCDataChannel) => Promise<void>;
  onError?: (error: string | null) => void;
}

interface UseRealtimeResult {
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
}

export function useRealtime({
  tokenUrl,
  baseUrl = "https://api.openai.com/v1/realtime",
  model = "gpt-4o-realtime-preview",
  voice = "ash",
  onReady,
  onError,
}: UseRealtimeOptions): UseRealtimeResult {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const modelRef = useRef<Model | null>(null);
  const isUpdatingRef = useRef(false);

  const connect = async () => {
    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);

      if (onError) {
        onError(null);
      }

      // Get ephemeral token
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, voice }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "An unknown error occurred");
      }

      const token = await tokenResponse.json();

      if (!token.value) {
        throw new Error("Failed to retrieve token");
      }

      // Create WebRTC peer connection
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Configure audio output
      peerConnection.ontrack = (event) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = event.streams[0];
        }
      };

      // Configure audio input
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, mediaStream);
      });

      // Create data channel for events
      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("open", handleDataChannelOpen);
      dataChannel.addEventListener("message", handleDataChannelMessage);

      // Negotiate Server Description Protocol (SDP) connection
      const localDescription = await peerConnection.createOffer();

      await peerConnection.setLocalDescription(localDescription);

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: localDescription.sdp,
        headers: {
          Authorization: `Bearer ${token.value}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`Failed to connect: ${errorText}`);
      }

      const sdpResponseText = await sdpResponse.text();

      const remoteDescription: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: sdpResponseText,
      };

      await peerConnection.setRemoteDescription(remoteDescription);

      setIsConnected(true);
    } catch (error) {
      handleError(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }

    setIsConnected(false);
  };

  const handleDataChannelOpen = async () => {
    const model = new Model({
      promptCallback: handlePrompt,
      updateCallback: handleUpdate,
      exitCallback: handleExit,
    });

    modelRef.current = model;

    // Signal that the model is ready
    try {
      if (onReady && dataChannelRef.current) {
        await onReady(model, dataChannelRef.current);
      }
    } catch (error) {
      handleError(error);
    }

    // Request that the model speaks first
    sendResponseRequest(false);
  };

  const handleDataChannelMessage = async (event: MessageEvent) => {
    let message: Record<string, unknown> = {};

    try {
      message = JSON.parse(event.data);
    } catch (error) {
      handleError(error);
    }

    // Handle incoming messages according to type
    switch (message.type) {
      case "response.function_call_arguments.done": {
        handleToolCall(message.call_id as string, message as ToolCall);

        break;
      }

      case "error": {
        const error = message.error as { message: string };

        if (onError) {
          onError(error.message);
        }

        break;
      }
    }
  };

  const handlePrompt = (text: string) => {
    sendPrompt(text);
  };

  const handleUpdate = () => {
    if (isUpdatingRef.current) {
      return;
    }

    // Send tools once at the end of the run loop
    isUpdatingRef.current = true;

    queueMicrotask(() => {
      isUpdatingRef.current = false;
      sendTools();
    });
  };

  const handleExit = () => {
    disconnect();
  };

  const handleToolCall = async (toolCallId: string, toolCall: ToolCall) => {
    if (!modelRef.current) {
      return;
    }

    // Execute the tool with its arguments
    try {
      await modelRef.current.getFunction(toolCall)();
    } catch (error) {
      handleError(error);
      sendToolError(toolCallId, error);
    }

    // Request that that model responds immediately
    sendResponseRequest(true);
  };

  const handleError = (error: unknown) => {
    const errorText = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(errorText);

    if (onError) {
      onError(errorText);
    }
  };

  const sendPrompt = (text: string) => {
    const message = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "system",
        content: [
          {
            type: "input_text",
            text,
          },
        ],
      },
    };

    sendMessage(message);
  };

  const sendTools = () => {
    if (!modelRef.current) {
      return;
    }

    const tools = modelRef.current.getTools();

    const message = {
      type: "session.update",
      session: {
        tools: tools.map((tool) => tool.schema),
      },
    };

    sendMessage(message);
  };

  const sendToolError = (toolCallId: string, error: unknown) => {
    const errorText = error instanceof Error ? error.message : "An unknown error occurred";

    const message = {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: toolCallId,
        output: errorText,
      },
    };

    sendMessage(message);
  };

  const sendResponseRequest = (includeTools: boolean) => {
    const message = includeTools
      ? {
          type: "response.create",
        }
      : {
          type: "response.create",
          response: {
            tools: [],
          },
        };

    sendMessage(message);
  };

  const sendMessage = (message: unknown) => {
    try {
      dataChannelRef.current?.send(JSON.stringify(message));
    } catch (error) {
      handleError(error);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    connect,
    disconnect,
    audioElementRef,
  };
}
