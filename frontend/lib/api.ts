export async function generateSummary(text: string, summaryLevel: string) {
  const response = await fetch('/generate-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, summary_level: summaryLevel }),
  });
  return response.json();
}

export async function generatePodcast(summaryText: string, creativityLevel: string, podcastLength: string) {
  const response = await fetch('/generate-podcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary_text: summaryText,
      creativity_level: creativityLevel,
      podcast_length: podcastLength,
    }),
  });
  return response.json();
}

export async function generatePPT(summaryText: string, templateName: string) {
  const response = await fetch('/generate-ppt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary_text: summaryText, template_name: templateName }),
  });
  return response.json();
}

export async function generateAudio(podcastScript: string): Promise<Blob> {
  const response = await fetch('/generate-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ podcast_script: podcastScript }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate audio');
  }

  return response.blob(); // Return the audio file as a Blob
}