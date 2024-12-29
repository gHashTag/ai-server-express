import axios from 'axios';

export async function generateImageToPrompt(imageUrl: string): Promise<string> {
  try {
    const initResponse = await axios.post(
      'https://fancyfeast-joy-caption-alpha-two.hf.space/call/stream_chat',
      {
        data: [{ path: imageUrl }, 'Descriptive', 'long', ['Describe the image in detail, including colors, style, mood, and composition.'], '', ''],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      },
    );

    const eventId = initResponse.data?.event_id || initResponse.data;
    if (!eventId) {
      throw new Error('No event ID in response');
    }

    const resultResponse = await axios.get(`https://fancyfeast-joy-caption-alpha-two.hf.space/call/stream_chat/${eventId}`, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const responseText = resultResponse.data as string;
    const lines = responseText.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (Array.isArray(data) && data.length > 1) {
            const caption = data[1];
            return caption;
          }
        } catch (e) {
          console.error('Error parsing JSON from line:', line, e);
        }
      }
    }

    throw new Error('No valid caption found in response');
  } catch (error) {
    console.error('Joy Caption API error:', error);
    throw error;
  }
}
