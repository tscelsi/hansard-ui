/** Map between speech tone and its conduciveness to good discussion/debate (0 to 1) low=bad*/
export const speechTonePositivity: Record<string, number> = {
    // Emotional / Relational
    caring: 0.9,
    heartfelt: 0.7,
    nostalgic: 0.5,
    sentimental: 0.5,
    empathetic: 1.0,
    inspirational: 0.8,
    reassuring: 0.85,

    // Humorous / Playful
    humorous: 0.7,
    sarcastic: 0.3,
    self_deprecating: 0.6,
    cheeky: 0.5,
    satirical: 0.4,
    deadpan: 0.4,

    // Assertive / Persuasive
    confident: 0.7,
    persuasive: 0.6,
    confrontational: 0.1,
    aggressive: 0.0,
    motivational: 0.7,
    empowered: 0.7,

    // Intellectual / Analytical
    reflective: 0.95,
    philosophical: 0.9,
    inquisitive: 1.0,
    objective: 1.0,
    didactic: 0.6,

    // Stylistic / Rhetorical
    storytelling: 0.7,
    conversational: 1.0,
    formal: 0.8,
    poetic: 0.5,
    dramatic: 0.3,
    minimalist: 0.7,

    // Dark / Intense
    somber: 0.2,
    melancholic: 0.2,
    ironic: 0.3,
    cynical: 0.1,
    foreboding: 0.0,
};

export type Tone = keyof typeof speechTonePositivity;

export const getSpeechTonePositivity = (tones: Tone[]): number => {
    if (tones.length === 0) {
        return 0.5; // Neutral if no tones detected
    }
    const totalPositivity = tones.reduce((sum, tone) => {
        const positivity = speechTonePositivity[tone] || 0.5; // Default to neutral if tone not found
        return sum + positivity;
    }, 0);
    return parseFloat((totalPositivity / tones.length).toFixed(2));
};