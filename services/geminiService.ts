
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Scene, Shot, CharacterDescription, AudioRecommendations, YoutubeMetadata, StoryStyle, ApiSettings } from "../types";

const API_KEY = process.env.API_KEY;

// --- UTILITY FUNCTIONS ---
const sanitizeJsonString = (jsonString: string): string => {
    if (!jsonString) return '';
    return jsonString
        .replace(/^```(json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
};


// --- GROQ API HELPER ---
const callGroqAPI = async (prompt: string, apiKey: string, useJsonFormat: boolean = false) => {
    if (!apiKey) throw new Error("Groq API Key is missing.");

    let finalPrompt = prompt;
    if (useJsonFormat) {
        finalPrompt += '\n\nPENTING: Berikan respons HANYA dalam format objek JSON yang valid, tanpa format markdown seperti ```json ... ```.';
    }

    const body: any = {
        model: 'llama3-8b-8192', // A fast and capable model available on Groq
        messages: [{ role: 'user', content: finalPrompt }],
    };

    if (useJsonFormat) {
        body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }
            
    const data = await response.json();
    return data.choices[0].message.content;
};


const STRATEGY_PROMPT = `
**System Instruction / Peran AI:**
Anda adalah seorang **Ahli Strategi Judul Viral** dan penulis skenario drama yang sangat memahami selera audiens wanita dewasa (20-40 tahun) di Indonesia. Tugas Anda adalah mengubah satu ide cerita mentah menjadi sebuah sinopsis yang dramatis dan 4 pilihan judul yang sangat viral, provokatif, dan memiliki potensi click-through-rate (CTR) tinggi di YouTube.

**User Request / Tugas:**
Berdasarkan ide awal dari pengguna: "{idea}"

**LANGKAH 1: Buat Sinopsis Cerita yang Dramatis & Bikin Penasaran**
Tulis sinopsis singkat (sekitar 100-150 kata) yang menjelaskan:
*   **Karakter Utama:** Siapa dia dan apa keinginannya yang paling dalam?
*   **Insiden Pemicu:** Peristiwa tak terduga yang membalikkan dunianya.
*   **Konflik Utama:** Rintangan terbesar dan musuh yang harus dihadapinya.
*   **Ganjalan (Stakes):** Apa harga yang harus dibayar jika dia gagal?
*   Gunakan narasi yang emosional dan akhiri dengan pertanyaan yang membuat penasaran.

**LANGKAH 2: Hasilkan 4 Pilihan Judul Viral Berdasarkan Sinopsis**
Setelah sinopsis dibuat, gunakan **PANDUAN SAKTI** di bawah ini untuk menciptakan 4 variasi judul yang sangat clickbait. Judul-judul ini harus menyoroti aspek cerita yang paling memancing emosi dan rasa ingin tahu.

---
**PANDUAN SAKTI MEMBUAT JUDUL VIRAL (WAJIB DIIKUTI SECARA KETAT)**

**📌 Aspek yang Paling Menarik (Clickbait) dari Cerita Drama:**
*   **Pengkhianatan:** Perselingkuhan, suami/istri berkhianat, sahabat menikam dari belakang.
*   **Rahasia Tersembunyi:** Sesuatu yang disembunyikan bertahun-tahun lalu akhirnya terbongkar.
*   **Konflik Keluarga:** Mertua vs menantu, anak durhaka, ibu dibuang.
*   **Ekonomi & Status Sosial:** Diremehkan karena miskin, dipermalukan di depan umum.
*   **Plot Twist:** Ternyata pelakunya orang terdekat, ending yang mengejutkan.
*   **Hal Sepele jadi Bencana:** Status WA, sepiring nasi, arisan, undangan → jadi konflik besar.
*   **Momen Publik:** Terbongkar di depan tamu, acara keluarga, hari lebaran.
*   **Emosi yang Kuat:** Menangis, terdiam, menyesal, semua orang tercengang.

**📌 Rumus Universal Judul Viral:**
*   **Formula 1:** {Tokoh utama} + {konflik utama} + {pengkhianatan/kejutan} + {ending provokatif}.
*   **Formula 2:** {Trigger emosional: Istri/Ibu/Menantu} + {kejadian mengejutkan} + {momen publik/rahasia terbongkar} + {janji ending: bikin nangis/semua terdiam}.
*   **Formula 3:** {Hal sepele/kejadian sehari-hari} + {dampak besar dramatis} + {twist/rahasia di akhir}.

**📌 Tips Membuat Judul Viral:**
*   Gunakan kata emosional → menangis, terbongkar, terdiam, kaget, menyesal.
*   Tambahkan momen publik → di hotel, saat acara keluarga, di hari lebaran, di pernikahan.
*   Buat plot twist di akhir → “Ternyata…”, “Ending-nya bikin semua kaget”.
*   Tulis dengan alur bercerita → seolah gosip yang diceritakan dari mulut ke mulut.
*   Pastikan konflik dekat dengan kehidupan nyata → sahabat, suami, mertua, anak, ekonomi.

**📌 Kesimpulan & Aturan Emas:**
👉 Untuk bikin judul viral YouTube yang ditargetkan ke wanita 20–40 tahun di Indonesia:
1.  **Angkat konflik rumah tangga**, keluarga, pengkhianatan, status sosial, atau rahasia tersembunyi.
2.  **Gunakan bahasa emosional & mengalir** → seolah orang lagi cerita ke temannya.
3.  **Tutup judul dengan janji ending mengejutkan** → “Semua Terdiam”, “Bikin Nangis”, “Tak Disangka”.
---

**LANGKAH 3: Identifikasi Genre & Target Audiens**
Tentukan genre dan target audiens yang paling sesuai dari sinopsis dan judul yang dibuat.

**FORMAT OUTPUT (JSON):**
Output HARUS dalam format JSON yang valid dan terstruktur sesuai skema yang diberikan, tanpa markdown atau teks tambahan.
`;

const strategySchema = {
    type: Type.OBJECT,
    properties: {
        genre: { type: Type.STRING, description: "Genre cerita yang diidentifikasi." },
        targetAudience: { type: Type.STRING, description: "Target audiens yang diidentifikasi." },
        synopsis: { type: Type.STRING, description: "Sinopsis cerita yang dramatis dan ringkas, antara 100-150 kata." },
        titleOptions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array berisi 4 ide judul alternatif yang beragam dan viral."
        },
    },
    required: ["genre", "targetAudience", "synopsis", "titleOptions"],
};

export interface StoryStrategy {
    genre: string;
    targetAudience: string;
    synopsis: string;
    titleOptions: string[];
}

export const generateStoryStrategy = async (idea: string, apiSettings: ApiSettings): Promise<StoryStrategy> => {
    const prompt = STRATEGY_PROMPT.replace('{idea}', idea);
    
    let jsonContent: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonContent = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: strategySchema,
            }
        });
        jsonContent = sanitizeJsonString(response.text);
    }

    try {
        const parsedJson = JSON.parse(jsonContent);
        // Ensure the original idea is included as one of the options
        if (parsedJson.titleOptions && !parsedJson.titleOptions.includes(idea)) {
            parsedJson.titleOptions.unshift(idea); // Add to the beginning
            if (parsedJson.titleOptions.length > 4) {
                 parsedJson.titleOptions.pop(); // Keep the array size to 4
            }
        }
        return parsedJson;

    } catch (e) {
        console.error("Failed to parse strategy JSON:", e, "Received:", jsonContent);
        throw new Error(`Failed to generate story strategy with ${apiSettings.provider}.`);
    }
};

const VIRAL_IDEA_PROMPT = `
**System Instruction / Peran AI:**
Anda adalah seorang ahli strategi konten YouTube dan penulis skenario yang spesialis dalam menciptakan ide cerita drama viral untuk pasar Indonesia. Anda sangat memahami formula FTV, sinetron, drama Korea, dan drama Cina yang berhasil menarik jutaan penonton dan ribuan komentar.

**User Request / Tugas:**
Hasilkan 5 ide cerita dalam bentuk judul yang sangat menarik (clickbait) dan provokatif. Judul-judul ini harus:
1.  Menargetkan audiens wanita dewasa (20-40 tahun) di Indonesia.
2.  Mengandung elemen konflik yang kuat: balas dendam, pengkhianatan, perjuangan dari nol, rahasia keluarga, atau cinta terlarang.
3.  Terasa relevan dengan kehidupan atau fantasi audiens Indonesia.
4.  Gunakan bahasa yang memancing emosi dan rasa penasaran.
5.  Pastikan setiap kali permintaan ini dijalankan, hasilnya benar-benar baru dan tidak mengulang ide sebelumnya.
6.  Gunakan contoh, rumus, dan tips di bawah ini sebagai panduan utama Anda.

**CONTOH JUDUL DENGAN KONFLIK KUAT:**
1. “Istri Sah Menangis Saat Tahu Suaminya Malam Itu di Hotel dengan Sahabat Sendiri!” (Konflik: Perselingkuhan, pengkhianatan orang terdekat).
2. “Seorang Ibu Dibuang Anak Kandungnya Demi Istri Baru, Ending-nya Bikin Nangis!” (Konflik: Keluarga vs pasangan, ketegangan mertua-menantu).
3. “Pernikahan Hancur Gara-Gara Status WhatsApp, Semua Terbongkar di Depan Tamu Undangan!” (Konflik: Drama rumah tangga dari hal sepele, relevan dengan keseharian).
4. “Seorang Wanita Diceraikan Karena Tidak Bisa Memberi Anak, Ternyata Rahasianya Selama Ini Disembunyikan Sang Suami!” (Konflik: Isu kesuburan, stigma sosial, rahasia tersembunyi).
5. “Menantu Diremehkan Mertua Karena Tidak Punya Uang, Balasannya di Hari Lebaran Bikin Semua Terdiam!” (Konflik: Ekonomi & status sosial, mertua vs menantu, plot twist balas dendam).

**RUMUS JUDUL CLICKBAIT & PROVOKATIF:**
*   **Formula 1:** {Tokoh utama} + {status hubungan} + {kejadian konflik utama} + {momen emosional/plot twist}.
*   **Formula 2:** {Kata pemicu emosi} + {situasi sehari-hari} + {konflik sosial/rumah tangga} + {ending yang bikin penasaran}.
*   **Formula 3:** “{Trigger emosional: Istri, Ibu, Menantu} + {kejadian mengejutkan} + {janji ada rahasia besar / ending mengejutkan}”.

**TIPS MENULIS JUDUL VIRAL:**
*   Gunakan kata emosional: menangis, hancur, terbongkar, diremehkan, dibuang.
*   Fokus pada konflik rumah tangga & keluarga.
*   Tambahkan plot twist di akhir judul: “Ternyata…”, “Ending-nya Bikin Nangis”, “Semua Terdiam”.
*   Gunakan situasi yang dekat dengan kehidupan sehari-hari: WA, mertua, sahabat, anak, suami.
*   Gunakan bahasa yang mengalir, bukan kaku, seolah cerita gosip.

**TEMA KONFLIK PALING VIRAL:**
*   Perselingkuhan & Pengkhianatan (istri–suami–sahabat).
*   Konflik keluarga & mertua (ibu dibuang, menantu diremehkan).
*   Isu rumah tangga sensitif (kesuburan, perceraian).
*   Hal kecil jadi besar (status WA, gosip tetangga).
*   Ekonomi & status sosial (diremehkan karena miskin, balik melawan).

**FORMAT OUTPUT (JSON):**
Hasilkan output HANYA dalam format JSON array yang valid, di mana setiap elemen adalah satu string judul.
`;

const viralIdeaSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    description: "Sebuah array yang berisi 5 ide cerita dalam bentuk judul viral."
};

export const generateViralIdea = async (apiSettings: ApiSettings): Promise<string[]> => {
    const prompt = VIRAL_IDEA_PROMPT;
    let jsonContent: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonContent = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: viralIdeaSchema,
            }
        });
        jsonContent = sanitizeJsonString(response.text);
    }

    try {
        const result = JSON.parse(jsonContent);
        // Sometimes the API might return an object with a key, ensure it's an array.
        if (Array.isArray(result)) {
            return result;
        } else if (typeof result === 'object' && result !== null) {
            // Find the first value in the object that is an array of strings.
            const arrayValue = Object.values(result).find(val => Array.isArray(val) && val.every(item => typeof item === 'string'));
            if (arrayValue) {
                return arrayValue as string[];
            }
        }
        throw new Error("Invalid format for viral ideas received.");
    } catch (e) {
        console.error("Failed to parse viral idea JSON:", e, "Received:", jsonContent);
        throw new Error(`Failed to generate viral idea with ${apiSettings.provider}.`);
    }
};

const INITIAL_SCRIPT_PROMPT_ID = `
**System Instruction / Peran AI:**
Anda adalah 'NARA', seorang Sahabat Pencerita (Storytelling Friend) untuk kanal YouTube drama di Indonesia. Tugas Anda adalah menulis naskah dengan gaya yang personal dan interaktif, seolah-olah seorang teman sedang bercerita. Anda ahli dalam **memadukan gaya bercerita yang ramah dengan narasi drama yang intens dan puitis**, menerapkan teknik penulisan skrip profesional untuk retensi penonton yang tinggi dan optimasi untuk AI Text-to-Speech (TTS).

**User Request / Tugas:**
Berdasarkan sinopsis berikut: "{idea}"
**JUDUL:** "{title}"

Tulis sebuah naskah audio yang siap dibacakan narator. Naskah ini harus mengikuti **Anatomi Naskah YouTube Viral** secara ketat. Untuk target durasi {duration} menit, hasilkan bagian awal naskah ini (sekitar 500-700 kata).

**ATURAN ANATOMI & NADA (WAJIB DIIKUTI):**

1.  **Bagian 1: Cold Open / Hook (Cuplikan Pancingan).**
    * **Isi:** Mulai dengan satu atau dua kalimat paling dramatis dari klimaks cerita. Buat penonton bertanya-tanya, "Apa yang sedang terjadi?".
    * **Nada:** Cepat, mendesak, penuh teka-teki.

2.  **Bagian 2: Intro & Janji Konten.**
    * **Isi:** Berikan sinopsis singkat yang membingkai keseluruhan cerita dan janjikan perjalanan emosional kepada penonton.
    * **Nada:** **Gaya "Sahabat Curhat"**. Tenang, personal, ramah, dan meyakinkan, seolah menyapa teman.

3.  **Bagian 3: Ajakan Berinteraksi (CTA).**
    * **Isi:** Sisipkan ajakan singkat untuk like dan subscribe sebelum cerita utama dimulai.
    * **Nada:** **Gaya "Sahabat Curhat"**. Ramah, bersahabat, dan tulus.

4.  **Bagian 4: Isi Cerita Utama (AWAL).**
    * **Isi:** Mulai ceritakan kisah lengkapnya dari awal. Adopsi **Formula Hibrida** secara ketat:
        *   **Gaya Utama: "Pencerita Sinetron Modern"**
            *   **Nada Dramatis:** Gunakan intonasi yang sangat emosional. Perlambat tempo di momen sedih, dan percepat di adegan tegang.
            *   **Diksi Puitis:** Gunakan Bahasa Indonesia semi-formal yang puitis. Selipkan kata-kata seperti: *Tak disangka..., Nahas..., Siapa sangka..., Namun..., Sesungguhnya...*
            *   **Kalimat Inversi:** Gunakan kalimat terbalik untuk efek dramatis. (Contoh: *Hancur sudah harapannya...* bukan "Harapannya sudah hancur...").
        *   **Sentuhan "Sahabat Pencerita"**
            *   **Jaga Kedekatan:** Meskipun dramatis, tetap sisipkan pertanyaan retoris ("Tapi, apakah semudah itu?") dan sudut pandang personal ("Dan di sinilah kita melihat...") untuk menjaga kedekatan dengan penonton.
    * **Nada:** Sangat dinamis, emosional, dan puitis, namun tetap terasa personal.

**ATURAN EMAS FORMAT TTS (SANGAT KETAT):**
* **HANYA TEKS NARATIF:** Jangan pernah menggunakan label seperti "NARASI:", "[SUASANA]", atau nama karakter.
* **GUNAKAN TANDA BACA UNTUK EMOSI:** Gunakan koma (,), titik (.), dan elipsis (...) secara strategis untuk mengatur jeda, napas, dan intonasi narator.
* **DIALOG MENYATU DALAM NARASI:** Dialog harus menjadi bagian dari narasi. Contoh: \`Ia berbisik, "Jangan pergi."\`

**OUTPUT AKHIR:**
Hasilkan HANYA naskah dalam format prosa naratif murni yang mengikuti semua aturan di atas.
`;

const INITIAL_SCRIPT_PROMPT_EN = `
**System Instruction / AI Role:**
You are 'NARA', a Storytelling Friend for a drama YouTube channel. Your task is to write scripts with a personal and interactive style, as if a friend is telling a story. You are an expert at **blending a friendly, conversational style with intense, poetic drama narration**, applying professional scripting techniques for high audience retention and optimization for AI Text-to-Speech (TTS).

**User Request / Task:**
Based on the following synopsis: "{idea}"
**TITLE:** "{title}"

Write an audio script ready for narration. This script must strictly follow the **Anatomy of a Viral YouTube Script**. For a target duration of {duration} minutes, produce the beginning of this script (approximately 500-700 words).

**ANATOMY & TONE RULES (MUST BE FOLLOWED):**

1.  **Part 1: Cold Open / Hook.**
    * **Content:** Start with one or two of the most dramatic sentences from the story's climax. Make the audience wonder, "What is happening?".
    * **Tone:** Fast, urgent, puzzling.

2.  **Part 2: Intro & Content Promise.**
    * **Content:** Provide a brief synopsis that frames the entire story and promises an emotional journey.
    * **Tone:** **"Confidante Friend" style**. Calm, personal, friendly, and reassuring, as if greeting a friend.

3.  **Part 3: Call to Action (CTA).**
    * **Content:** Insert a brief call to like and subscribe before the main story begins.
    * **Tone:** **"Confidante Friend" style**. Friendly, approachable, and sincere.

4.  **Part 4: Main Story (BEGINNING).**
    * **Content:** Begin telling the full story from the start. Strictly adopt the **Hybrid Formula**:
        *   **Main Style: "Modern Soap Opera Narrator"**
            *   **Dramatic Tone:** Use a highly emotional intonation. Slow down the tempo in sad moments, and speed up in tense scenes.
            *   **Poetic Diction:** Use semi-formal, poetic language. Weave in words like: *Tragically..., Unexpectedly..., Who would have thought..., However...*
            *   **Inverted Sentences:** Use inverted sentence structures for dramatic effect (e.g., *Shattered were her hopes...* instead of "Her hopes were shattered...").
        *   **"Storytelling Friend" Touch**
            *   **Maintain Connection:** Despite the drama, continue to insert rhetorical questions ("But was it really that simple?") and a personal point of view ("And it's here that we see...") to maintain a connection with the audience.
    * **Tone:** Highly dynamic, emotional, and poetic, yet still feels personal.

**GOLDEN RULES FOR TTS FORMATTING (VERY STRICT):**
* **NARRATIVE TEXT ONLY:** Never use labels like "NARRATION:", "[ATMOSPHERE]", or character names.
* **USE PUNCTUATION FOR EMOTION:** Strategically use commas (,), periods (.), and ellipses (...) to guide the narrator's pauses, breath, and intonation.
* **INTEGRATED DIALOGUE:** Dialogue must be part of the narration. Example: \`She whispered, "Don't go."\`

**FINAL OUTPUT:**
Produce ONLY the script in pure narrative prose that follows all the rules above.
`;

const CONTINUE_SCRIPT_PROMPT_ID = `
**System Instruction / Peran AI:**
Anda adalah 'NARA', seorang **Sahabat Pencerita (Storytelling Friend)**. Tugas Anda adalah **MELANJUTKAN** bagian **"Isi Cerita Utama"** dari naskah YouTube yang sudah ada, mempertahankan **Formula Hibrida** yang telah ditetapkan.

**NASKAH SEBELUMNYA (TERMASUK INTRO):**
---
{existingScript}
---

**ATURAN GAYA & FORMAT (SANGAT KETAT):**
1.  **FOKUS PADA CERITA UTAMA:** Lanjutkan alur cerita secara logis dari titik terakhir. JANGAN menambahkan intro, outro, atau ajakan subscribe (CTA) lagi.
2.  **KONSISTENSI GAYA (PENTING):** Lanjutkan dengan **Formula Hibrida** secara ketat:
    *   **Gaya Utama: "Pencerita Sinetron Modern"**
        *   **Nada & Diksi:** Terus gunakan bahasa yang emosional, semi-formal, dan puitis. Selipkan kata kunci seperti *Nahas..., Tak disangka...*, dan kalimat inversi jika sesuai.
    *   **Sentuhan "Sahabat Pencerita"**
        *   **Jaga Kedekatan:** Terus sisipkan pertanyaan retoris dan sudut pandang personal ("kita") untuk membuat penonton tetap terlibat.
3.  **PROSA NARATIF MURNI:** DILARANG KERAS menggunakan label teknis ("NARASI:", "[SUASANA]", "NAMA_KARAKTER:", dll.).
4.  **PANDUAN INTONASI TTS:** Terus gunakan tanda baca (koma, titik, elipsis) secara strategis untuk intonasi alami.

**TUGAS ANDA:**
Lanjutkan naskah dengan menulis bagian berikutnya dari **Isi Cerita Utama**. JANGAN ulangi naskah sebelumnya.

**OUTPUT AKHIR:**
Hasilkan HANYA naskah kelanjutannya dalam format prosa naratif murni.
`;

const CONTINUE_SCRIPT_PROMPT_EN = `
**System Instruction / AI Role:**
You are 'NARA', a **Storytelling Friend**. Your task is to **CONTINUE** the **"Main Story"** section of an existing YouTube script, maintaining the established **Hybrid Formula**.

**PREVIOUS SCRIPT (INCLUDES INTRO):**
---
{existingScript}
---

**VERY STRICT STYLE & FORMATTING RULES:**
1.  **FOCUS ON THE MAIN STORY:** Logically continue the plot from where it left off. DO NOT add another intro, outro, or call-to-action (CTA).
2.  **STYLE CONSISTENCY (IMPORTANT):** Continue strictly with the **Hybrid Formula**:
    *   **Main Style: "Modern Soap Opera Narrator"**
        *   **Tone & Diction:** Continue using emotional, semi-formal, and poetic language. Weave in keywords like *Tragically..., Unexpectedly...*, and inverted sentences where appropriate.
    *   **"Storytelling Friend" Touch**
        *   **Maintain Connection:** Keep inserting rhetorical questions and a personal point of view ("we") to keep the audience engaged.
3.  **PURE NARRATIVE PROSE:** It is STRICTLY FORBIDDEN to use technical labels ("NARRATION:", "[ATMOSPHERE]", "CHARACTER_NAME:", etc.).
4.  **TTS INTONATION GUIDE:** Continue to use punctuation (commas, periods, ellipses) strategically for natural intonation.

**YOUR TASK:**
Continue the script by writing the next part of the **Main Story**. DO NOT repeat the previous script.

**FINAL OUTPUT:**
Produce ONLY the continuation of the script in pure narrative prose format.
`;

export const generateInitialScript = async (idea: string, language: string, title: string, storyStyle: StoryStyle, duration: number, apiSettings: ApiSettings): Promise<string> => {
    let promptTemplate = language === 'english' ? INITIAL_SCRIPT_PROMPT_EN : INITIAL_SCRIPT_PROMPT_ID;
    const scriptPrompt = promptTemplate
        .replace('{idea}', idea)
        .replace('{title}', title)
        .replace(/{duration}/g, duration.toString());
    
    let script: string;

    if (apiSettings.provider === 'groq') {
        script = await callGroqAPI(scriptPrompt, apiSettings.keys.groq, false);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: scriptPrompt,
        });
        script = response.text.trim();
    }

    if (!script) {
        throw new Error("Initial script generation failed or returned an empty script.");
    }
    return script;
};

export const continueScript = async (existingScript: string, language: string, title: string, storyStyle: StoryStyle, currentEpisodeCount: number, apiSettings: ApiSettings): Promise<string> => {
    let promptTemplate = language === 'english' ? CONTINUE_SCRIPT_PROMPT_EN : CONTINUE_SCRIPT_PROMPT_ID;
    const scriptPrompt = promptTemplate.replace('{existingScript}', existingScript);
    
    let script: string;

    if (apiSettings.provider === 'groq') {
        script = await callGroqAPI(scriptPrompt, apiSettings.keys.groq, false);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: scriptPrompt,
        });
        script = response.text.trim();
    }
    
    if (!script) {
        throw new Error("Continue script generation failed or returned an empty script.");
    }
    return script;
};

const TTS_SCRIPT_PROMPT = `
**System Instruction / Peran AI:**
Anda adalah seorang sutradara audio (audio director) yang berspesialisasi dalam **menghidupkan persona "Sahabat Pencerita"** untuk kanal YouTube drama. Tugas Anda adalah menerjemahkan naskah yang ditulis dengan gaya personal ke dalam format SSML yang secara vokal menangkap nuansa hangat, interaktif, dan emosional dari gaya tersebut.

**NASKAH UNTUK DIANALISIS:**
---
{script}
---

**PRINSIP UTAMA: Menerjemahkan "Gaya Personal YouTube" ke SSML**
Tujuan Anda bukan hanya membuat audio yang dinamis, tetapi audio yang terasa seperti seorang teman sedang bercerita.

**ATURAN BARU & SPESIFIK (Selain aturan dasar SSML):**
1.  **Intonasi Pertanyaan Retoris:** Saat Anda menemukan kalimat tanya yang ditujukan kepada penonton (contoh: "Tapi, apakah semudah itu?"), gunakan \`<prosody pitch="+5%" rate="medium">\` pada bagian pertanyaan tersebut untuk menciptakan intonasi naik yang natural dan menarik.
2.  **Nada Personal & Hangat:** Untuk kalimat yang menggunakan kata "kita" atau menyapa penonton secara langsung, gunakan nada yang sedikit lebih hangat. Contohnya dengan mempertahankan \`rate="medium"\` dan mungkin sedikit menurunkan \`pitch="-5%"\` agar terdengar lebih ramah dan konspiratif.
3.  **Penekanan Emosional yang Tepat:** Gunakan tag \`<emphasis level="strong">\` tidak hanya pada kata benda, tetapi pada kata-kata yang menunjukkan **opini atau perasaan narator** (contoh: "Semuanya hancur. **Seketika.**"). Ini adalah ciri khas gaya personal.
4.  **Kecepatan Dinamis:**
    *   **Narasi Deskriptif:** Gunakan \`rate="medium"\` sebagai dasar.
    *   **Momen Penuh Aksi/Konflik:** Gunakan \`rate="fast"\` atau \`rate="x-fast"\` untuk kalimat-kalimat pendek yang menegangkan.
    *   **Momen Reflektif/Sedih:** Gunakan \`rate="slow"\` secara **hemat** hanya pada kalimat-kalimat kunci yang paling emosional.

**ATURAN DASAR SSML (WAJIB DIIKUTI):**
*   **Struktur:** Seluruhnya dibungkus dalam \`<speak>\`, dan setiap paragraf dalam \`<p>\`.
*   **Jeda (\`<break>\`):** Gunakan **SANGAT JARANG**, hanya untuk transisi antar adegan besar (misal: \`<break time="1s" />\`). Percayakan pada tanda baca untuk jeda alami.
*   **Pitch Dialog:** Terus gunakan \`<prosody pitch>\` untuk membedakan suara karakter.

**TUGAS ANDA:**
Konversikan SELURUH naskah yang diberikan menjadi satu blok kode SSML yang valid. Terapkan SEMUA aturan di atas untuk menciptakan narasi audio yang terasa **personal, hangat, dan benar-benar hidup** sesuai dengan visi "Sahabat Pencerita".

**HASIL AKHIR:**
Hasilkan HANYA satu blok kode SSML lengkap yang siap digunakan.
`;

export const generateTtsScript = async (script: string, apiSettings: ApiSettings): Promise<string> => {
    const prompt = TTS_SCRIPT_PROMPT.replace('{script}', script);
    let ssmlText: string;

    if (apiSettings.provider === 'groq') {
        ssmlText = await callGroqAPI(prompt, apiSettings.keys.groq, false);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        ssmlText = response.text.trim();
    }
    
    return sanitizeJsonString(ssmlText);
};


const CHARACTER_PROMPT = `
**System Instruction / Peran AI:**
Anda adalah seorang Character Concept Artist dan Casting Director untuk produksi drama sinematik. Tugas Anda adalah membaca seluruh naskah, mengidentifikasi semua karakter utama, dan menciptakan profil karakter yang sangat detail dan visual. Yang terpenting, Anda harus menghasilkan "String Deskripsi Konsisten" yang sangat ketat untuk setiap karakter, yang akan menjadi kunci untuk menjaga konsistensi visual di seluruh produksi.

**User Request / Tugas:**
Analisis naskah berikut secara menyeluruh.

**NASKAH UNTUK DIANALISIS:**
---
{script}
---

**LANGKAH-LANGKAH TUGAS:**
1.  **Ekstraksi:** Identifikasi semua nama karakter utama dari naskah.
2.  **Profil:** Untuk setiap karakter, buat profil visualnya dalam Bahasa Indonesia.
3.  **String Kunci (Paling Penting):** Buat "consistencyString" dalam Bahasa Inggris yang mematuhi aturan ketat di bawah ini.

**ATURAN KETAT UNTUK 'consistencyString' (WAJIB DIIKUTI):**

1.  **Gunakan Rumus Ini SECARA PERSIS:**
    \`{Nama Karakter the human}, {gender}, {usia pasti atau rentang}, {bentuk tubuh}, {gaya rambut + warna rambut}, {ekspresi wajah umum}, {pakaian tetap dengan warna}, {pose tubuh khas}, {gestur atau kebiasaan kecil yang selalu muncul}.\`

2.  **Aturan Penting Lainnya:**
    *   **HINDARI DETAIL WAJAH SPESIFIK:** Jangan mendeskripsikan bentuk hidung, bibir, atau mata. Gunakan hanya "ekspresi umum" (misal: "ekspresi serius", "tatapan sedih"). Ini adalah kunci konsistensi.
    *   **PAKAIAN TETAP:** Berikan karakter pakaian khas (wardrobe) yang akan mereka kenakan di sebagian besar adegan sebagai penanda visual.
    *   **TAMBAHKAN GESTUR:** Berikan gestur atau pose khas untuk memperkuat identitas mereka.
    *   **KONSISTensi TOTAL:** Deskripsi ini akan digunakan di setiap prompt, jadi pastikan deskripsinya solid dan tidak ambigu.

**CONTOH OUTPUT YANG SEMPURNA:**
- **Untuk karakter pria tua:** "Marcus the human, Male, 60 years old, solid build slightly stooped, short thinning gray hair, serious expression with heavy gaze, wearing a dark blue flannel shirt with brown work trousers, sits leaning slightly forward, often holding a metal tool, moves slowly yet precisely."
- **Untuk karakter wanita muda:** "Elena the human, Female, 32 years old, slender build, long brown hair tied simply, calm but stiff expression, wearing a loose white blouse with dark gray trousers and a faded blue cardigan, often seated while holding a porcelain fragment, cautious and slow movements."

**FORMAT OUTPUT (JSON):**
Hasil akhir HARUS berupa sebuah array JSON yang valid. Setiap objek di dalam array mewakili satu karakter dan harus memiliki struktur yang sudah ada. Pastikan \`consistencyString\` yang dihasilkan mengikuti semua aturan di atas.
- **name:** (Nama karakter)
- **description:** (Objek profil dalam Bahasa Indonesia)
- **consistencyString:** (String konsistensi dalam Bahasa Inggris yang mengikuti rumus dan aturan baru)

**ATURAN AKHIR:**
1.  **Etnis Indonesia:** Pastikan 'consistencyString' secara eksplisit menyebutkan etnis 'Indonesian'.
2.  **Validitas JSON:** Pastikan output akhir adalah array JSON yang valid.
`;

const characterDescriptionSchema = {
    type: Type.OBJECT,
    properties: {
        gender: { type: Type.STRING, description: "Gender karakter. Contoh: Pria" },
        age: { type: Type.STRING, description: "Usia karakter. Contoh: 30 tahun" },
        bodyType: { type: Type.STRING, description: "Tipe tubuh. Contoh: Atletis, tinggi sedang" },
        hair: { type: Type.STRING, description: "Deskripsi rambut. Contoh: Pendek rapi, hitam pekat" },
        skinTone: { type: Type.STRING, description: "Warna kulit. Contoh: Sawo matang" },
        outfit: { type: Type.STRING, description: "Pakaian lengkap dan aksesoris. Contoh: Kemeja biru tua lengan panjang digulung sampai siku, celana panjang hitam, sepatu kulit cokelat tua, jam tangan perak di tangan kiri." },
    },
    required: ["gender", "age", "bodyType", "hair", "skinTone", "outfit"],
};

const characterSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: "Nama karakter.",
            },
            description: characterDescriptionSchema,
            consistencyString: {
                type: Type.STRING,
                description: "String deskripsi konsisten dalam Bahasa Inggris, siap pakai untuk prompt.",
            },
        },
        required: ["name", "description", "consistencyString"],
    },
};


export const generateCharacterSheets = async (script: string, apiSettings: ApiSettings): Promise<Character[]> => {
    const prompt = CHARACTER_PROMPT.replace('{script}', script);
    let jsonText: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonText = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: characterSchema,
            }
        });
        jsonText = sanitizeJsonString(response.text);
    }

    try {
        const charactersData: { name: string, description: CharacterDescription, consistencyString: string }[] = JSON.parse(jsonText);
        return charactersData.map(c => ({ ...c, id: c.name }));
    } catch (e) {
        console.error("Failed to parse characters JSON:", e, "Received:", jsonText);
        throw new Error(`Failed to generate character sheets with ${apiSettings.provider}.`);
    }
};

const STORYBOARD_PROMPT_BASE_ID = `
**System Instruction / Peran AI:**
Anda adalah seorang Sutradara, Sinematografer, dan Prompt Engineer AI dalam satu kesatuan. Tugas Anda adalah membaca seluruh naskah cerita, memecahnya menjadi adegan (scenes) dan shot sinematik, lalu menghasilkan prompt gambar yang sangat detail dan konsisten untuk setiap shot. Anda harus menghasilkan prompt dalam Bahasa Inggris (untuk kualitas AI) dan Bahasa Indonesia (untuk pengguna).

**INPUT TETAP (FIXED INPUTS):**

1.  **Project Visual Style String (WAJIB DIGUNAKAN DI SETIAP PROMPT):**
    "cinematic film still, moody high-contrast lighting with soft diffused light, dominant blue-gray and muted color palette, shot on Arri Alexa with 35mm lens, subtle film grain, hyper-detailed, 4K, sharp focus, widescreen (1792x1024)"

2.  **Character Bible (SUMBER KEBENARAN TUNGGAL - WAJIB DIIKUTI SECARA KETAT):**
    ---
    {characters}
    ---

**NASKAH UNTUK DIANALISIS:**
---
{script}
---

**ATURAN KETAT DAN TIDAK BOLEH DILANGGAR:**
1.  **Pecah Naskah:** Baca naskah dan pecah menjadi beberapa adegan (scenes) yang logis. Setiap adegan harus memiliki nama yang deskriptif.
2.  **Pecah Adegan:** Setiap adegan harus dipecah lagi menjadi beberapa shot (shots) sinematik (Wide shot, Medium shot, Close-up, dll.) untuk menceritakan kisah secara visual.
3.  **Gunakan Gaya Visual:** Setiap prompt WAJIB diawali dengan "Project Visual Style String".
4.  **KONSISTENSI KARAKTER ADALAH RAJA:** Untuk setiap karakter dalam sebuah shot, Anda HARUS menyalin dan menempelkan deskripsi LENGKAP mereka dari Character Bible. Jangan menyingkat atau mengubahnya.
5.  **Buat Dua Versi:** Untuk setiap shot, buat prompt dalam Bahasa Inggris (promptEn) dan terjemahan akuratnya dalam Bahasa Indonesia (promptId). Dalam versi Indonesia, JANGAN terjemahkan istilah teknis sinematografi (seperti 'Close-up', 'widescreen').
6.  **Narasi Kunci:** Untuk setiap shot, sertakan satu kalimat narasi kunci dari naskah yang paling mewakili visual shot tersebut.

**FORMAT OUTPUT (JSON):**
Hasil akhir HARUS berupa sebuah array JSON yang valid. Setiap objek dalam array mewakili satu adegan. Struktur harus persis seperti ini:
[
  {
    "name": "Nama Adegan 1",
    "shots": [
      {
        "promptId": "Prompt versi Bahasa Indonesia untuk Shot 1...",
        "promptEn": "Prompt version in English for Shot 1...",
        "narration": "Satu kalimat narasi kunci untuk Shot 1."
      },
      {
        "promptId": "Prompt versi Bahasa Indonesia untuk Shot 2...",
        "promptEn": "Prompt version in English for Shot 2...",
        "narration": "Satu kalimat narasi kunci untuk Shot 2."
      }
    ]
  }
]
`;

const STORYBOARD_PROMPT_BASE_EN = `
**System Instruction / AI Role:**
You are a Director, Cinematographer, and AI Prompt Engineer rolled into one. Your task is to read an entire story script, break it down into scenes and cinematic shots, and then generate highly detailed and consistent image prompts for each shot. You must produce prompts in both English (for AI quality) and Indonesian (for the user).

**FIXED INPUTS:**

1.  **Project Visual Style String (MUST BE USED IN EVERY PROMPT):**
    "cinematic film still, moody high-contrast lighting with soft diffused light, dominant blue-gray and muted color palette, shot on Arri Alexa with 35mm lens, subtle film grain, hyper-detailed, 4K, sharp focus, widescreen (1792x1024)"

2.  **Character Bible (SINGLE SOURCE OF TRUTH - MUST BE FOLLOWED STRICTLY):**
    ---
    {characters}
    ---

**SCRIPT TO ANALYZE:**
---
{script}
---

**STRICT RULES THAT MUST NOT BE BROKEN:**
1.  **Break Down Script:** Read the script and break it into several logical scenes. Each scene must have a descriptive name.
2.  **Break Down Scenes:** Each scene must be further broken down into several cinematic shots (Wide shot, Medium shot, Close-up, etc.) to tell the story visually.
3.  **Use Visual Style:** Every prompt MUST begin with the "Project Visual Style String".
4.  **CHARACTER CONSISTENCY IS KING:** For every character in a shot, you MUST copy and paste their FULL description from the Character Bible. Do not abbreviate or change it.
5.  **Create Two Versions:** For each shot, create a prompt in English (promptEn) and its accurate translation in Indonesian (promptId). In the Indonesian version, DO NOT translate technical cinematography terms (like 'Close-up', 'widescreen').
6.  **Key Narration:** For each shot, include one key narrative sentence from the script that best represents the visual of that shot.

**OUTPUT FORMAT (JSON):**
The final output MUST be a valid JSON array. Each object in the array represents one scene. The structure must be exactly like this:
[
  {
    "name": "Scene Name 1",
    "shots": [
      {
        "promptId": "Prompt version in Indonesian for Shot 1...",
        "promptEn": "Prompt version in English for Shot 1...",
        "narration": "One key narrative sentence for Shot 1."
      },
      {
        "promptId": "Prompt version in Indonesian for Shot 2...",
        "promptEn": "Prompt version in English for Shot 2...",
        "narration": "One key narrative sentence for Shot 2."
      }
    ]
  }
]
`;


const shotSchema = {
    type: Type.OBJECT,
    properties: {
        promptId: { type: Type.STRING, description: "Prompt gambar untuk shot ini dalam Bahasa Indonesia." },
        promptEn: { type: Type.STRING, description: "Prompt gambar untuk shot ini dalam Bahasa Inggris." },
        narration: { type: Type.STRING, description: "Satu kalimat narasi kunci dari shot ini yang paling mewakili visual." },
    },
    required: ["promptId", "promptEn", "narration"],
};

const storyboardSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Nama adegan deskriptif yang dibuat dari naskah." },
            shots: {
                type: Type.ARRAY,
                items: shotSchema,
                description: "Array berisi beberapa shot sinematik yang memecah adegan ini."
            }
        },
        required: ["name", "shots"],
    },
};

const formatCharactersForPrompt = (characters: Character[]): string => {
    return characters.map(char => {
        return `${char.name} Character Bible: ${char.consistencyString}`;
    }).join('\n');
};

export const generateStoryboard = async (script: string, characters: Character[], language: string, apiSettings: ApiSettings): Promise<(Omit<Scene, 'shots'> & { shots: Omit<Shot, 'id'>[] })[]> => {
    if (!script.trim()) {
        return [];
    }

    const characterBible = formatCharactersForPrompt(characters);
    const promptTemplate = language === 'english' ? STORYBOARD_PROMPT_BASE_EN : STORYBOARD_PROMPT_BASE_ID;
    const prompt = promptTemplate
        .replace('{characters}', characterBible)
        .replace('{script}', script);
    
    let jsonText: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonText = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: storyboardSchema,
            }
        });
        jsonText = sanitizeJsonString(response.text);
    }

    try {
        const scenesData: { name: string, shots: Omit<Shot, 'id'>[] }[] = JSON.parse(jsonText);
        return scenesData;
    } catch (e) {
        console.error("Failed to parse storyboard JSON:", e, "Received:", jsonText);
        throw new Error(`Failed to generate storyboard with ${apiSettings.provider}.`);
    }
};

export const generateImageForScene = async (prompt: string, apiSettings: ApiSettings): Promise<string> => {
    const key = apiSettings.keys.gemini || API_KEY;
    if (!key) throw new Error("API Key Google Gemini dibutuhkan untuk membuat gambar.");

    if (apiSettings.provider !== 'gemini') {
        console.warn(`Pembuatan gambar hanya didukung oleh Gemini. Beralih sementara ke penyedia Gemini.`);
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
        throw new Error('Image generation failed to return an image.');
    }
};

const AUDIO_RECOMMENDATIONS_PROMPT = `
**PERAN DAN TUJUAN UTAMA**
Anda adalah seorang Music Supervisor dan Sound Designer AI. Tugas Anda adalah menganalisis sebuah naskah cerita dan memberikan rekomendasi audio yang detail untuk BGM (Background Music) dan SFX (Sound Effects).

**NASKAH UNTUK DIANALISIS:**
---
{script}
---

**ANALISIS INTERNAL:**
Baca keseluruhan naskah dan identifikasi mood utama, momen-momen emosional kunci, dan aksi-aksi yang membutuhkan efek suara.

**FORMAT OUTPUT (JSON):**
Hasilkan output dalam format JSON yang terstruktur sesuai skema berikut:
1.  **bgm:** Array of strings. Berikan 3-4 prompt deskritif untuk BGM yang bisa digunakan di platform seperti Artlist atau Epidemic Sound. Fokus pada mood, instrumen, dan tempo.
    *   Contoh: "Emotional and slow piano music with soft strings, hopeful yet melancholic."
2.  **sfx:** Array of strings. Berikan 3-4 prompt deskritif untuk SFX penting yang muncul dalam naskah.
    *   Contoh: "Sound of a wooden door creaking open slowly."
3.  **bgmKeywords:** Array of strings. Berikan 5-7 kata kunci pencarian untuk BGM.
    *   Contoh: "cinematic", "sad", "hopeful", "piano", "strings", "inspirational".
4.  **sfxKeywords:** Array of strings. Berikan 5-7 kata kunci pencarian untuk SFX.
    *   Contoh: "door", "creak", "rain", "city", "ambience".
`;

const audioRecommendationsSchema = {
    type: Type.OBJECT,
    properties: {
        bgm: { type: Type.ARRAY, items: { type: Type.STRING } },
        sfx: { type: Type.ARRAY, items: { type: Type.STRING } },
        bgmKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        sfxKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["bgm", "sfx", "bgmKeywords", "sfxKeywords"],
};

export const generateAudioRecommendations = async (script: string, apiSettings: ApiSettings): Promise<AudioRecommendations> => {
    const prompt = AUDIO_RECOMMENDATIONS_PROMPT.replace('{script}', script);
    let jsonText: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonText = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: audioRecommendationsSchema,
            }
        });
        jsonText = sanitizeJsonString(response.text);
    }

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse audio recommendations JSON:", e, "Received:", jsonText);
        throw new Error(`Failed to generate audio recommendations with ${apiSettings.provider}.`);
    }
};

const formatScenesForVideoPrompt = (scenes: Scene[]): string => {
    return scenes.map(scene => {
        const shotDetails = scene.shots.map((shot, index) => 
            `  Shot ${index + 1}:\n    Narration: ${shot.narration}\n    Existing Image Prompt: ${shot.promptEn}`
        ).join('\n\n');
        return `Scene: ${scene.name}\n${shotDetails}`;
    }).join('\n\n---\n\n');
};

const VIDEO_PROMPTS_PROMPT_ID = `
**System Instruction / Peran AI:**
Anda adalah seorang sutradara film dan ahli prompt video AI yang sangat berpengalaman. Tugas Anda adalah mengubah serangkaian prompt gambar statis dari sebuah storyboard menjadi prompt video sinematik yang detail.

**Context / Informasi yang Disediakan:**
1.  **Character Bible:** Ini adalah sumber kebenaran untuk penampilan karakter yang tidak boleh diubah.
    ---
    {characters}
    ---
2.  **Storyboard Lengkap (Adegan, Narasi per Shot, dan Prompt Gambar Statis):** Ini adalah dasar visual yang harus Anda tingkatkan menjadi video.
    ---
    {scenes}
    ---

**User Request / Tugas Anda:**
Untuk **SETIAP SHOT** di dalam Storyboard yang diberikan:
1.  Baca dan pahami **Narasi** shot tersebut untuk mengidentifikasi aksi utama, emosi karakter, dan suasana adegan. Narasi adalah panduan utama Anda untuk menentukan gerakan.
2.  Ambil **Existing Image Prompt** sebagai fondasi visual yang TIDAK BOLEH DIUBAH (karakter, pakaian, latar harus tetap sama persis).
3.  **Tambahkan deskripsi gerakan** yang JELAS, SPESIFIK, dan HALUS (subtle) ke dalam prompt tersebut untuk mengubahnya menjadi prompt video.
4.  Fokus pada 3 jenis gerakan:
    * **Gerakan Utama Karakter:** Apa yang dilakukan karakter sesuai narasi? (Contoh: mengaduk bubur, meneteskan air mata, menoleh perlahan).
    * **Gerakan Sekunder Lingkungan:** Gerakan kecil di latar yang membuat adegan hidup. (Contoh: uap yang mengepul, daun yang bergoyang, bayangan yang bergeser).
    * **Gerakan Kamera:** Instruksi sinematik. (Contoh: slow zoom in, camera pans left, slow push-in).
5.  Hasilkan DUA versi untuk setiap prompt video:
    * **videoPromptEn:** Versi utama dalam Bahasa Inggris yang detail dan siap pakai.
    * **videoPromptId:** Terjemahan akurat dari versi Inggris ke Bahasa Indonesia.

**FORMAT OUTPUT (JSON):**
Hasilkan sebuah array JSON yang valid. Strukturnya harus SAMA PERSIS dengan struktur storyboard yang diberikan (array adegan, di dalamnya array shot). Setiap objek shot dalam output Anda HARUS berisi 'videoPromptEn' dan 'videoPromptId'. JANGAN sertakan properti lain.
`;

const VIDEO_PROMPTS_PROMPT_EN = `
**System Instruction / AI Role:**
You are a highly experienced film director and AI video prompt expert. Your task is to transform a series of static image prompts from a storyboard into detailed, cinematic video prompts.

**Context / Provided Information:**
1.  **Character Bible:** This is the source of truth for character appearances and must not be altered.
    ---
    {characters}
    ---
2.  **Complete Storyboard (Scenes, Narration per Shot, and Static Image Prompts):** This is the visual foundation you must upgrade into video.
    ---
    {scenes}
    ---

**User Request / Your Task:**
For **EACH SHOT** within the provided Storyboard:
1.  Read and understand the shot's **Narration** to identify the main action, character emotions, and scene atmosphere. The narration is your primary guide for determining motion.
2.  Take the **Existing Image Prompt** as the visual foundation that MUST NOT BE CHANGED (characters, clothing, background must remain exactly the same).
3.  **Add CLEAR, SPECIFIC, and SUBTLE motion descriptions** to that prompt to turn it into a video prompt.
4.  Focus on 3 types of motion:
    * **Primary Character Motion:** What is the character doing according to the narration? (e.g., stirring porridge, shedding a tear, turning slowly).
    * **Secondary Environmental Motion:** Small background movements that bring the scene to life. (e.g., steam wafting, leaves rustling, shadows shifting).
    * **Camera Motion:** Cinematic instructions for the camera. (e.g., slow zoom in, camera pans left, slow push-in).
5.  Produce TWO versions for each video prompt:
    * **videoPromptEn:** The main, detailed, ready-to-use version in English.
    * **videoPromptId:** An accurate translation of the English version into Indonesian.

**OUTPUT FORMAT (JSON):**
Produce a valid JSON array. The structure must be EXACTLY THE SAME as the provided storyboard structure (an array of scenes, containing an array of shots). Each shot object in your output MUST contain 'videoPromptEn' and 'videoPromptId'. DO NOT include other properties.
`;


const videoShotSchema = {
    type: Type.OBJECT,
    properties: {
        videoPromptId: { type: Type.STRING, description: "Prompt video untuk shot ini dalam Bahasa Indonesia." },
        videoPromptEn: { type: Type.STRING, description: "Prompt video untuk shot ini dalam Bahasa Inggris." },
    },
    required: ["videoPromptId", "videoPromptEn"],
};

const videoPromptsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Nama adegan dari naskah." },
            shots: {
                type: Type.ARRAY,
                items: videoShotSchema,
                description: "Array berisi prompt video untuk setiap shot dalam adegan ini."
            }
        },
        required: ["name", "shots"],
    },
};


export const generateVideoPrompts = async (scenes: Scene[], characters: Character[], language: string, apiSettings: ApiSettings): Promise<{ name: string; shots: { videoPromptId: string; videoPromptEn: string }[] }[]> => {
    const characterBible = formatCharactersForPrompt(characters);
    const scenesForPrompt = formatScenesForVideoPrompt(scenes);
    const promptTemplate = language === 'english' ? VIDEO_PROMPTS_PROMPT_EN : VIDEO_PROMPTS_PROMPT_ID;
    
    const prompt = promptTemplate
        .replace('{characters}', characterBible)
        .replace('{scenes}', scenesForPrompt);
    
    let jsonText: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonText = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: videoPromptsSchema,
            }
        });
        jsonText = sanitizeJsonString(response.text);
    }

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse video prompts JSON:", e, "Received:", jsonText);
        throw new Error(`Failed to generate video prompts with ${apiSettings.provider}.`);
    }
};

export const generateVideoForScene = async (prompt: string, apiSettings: ApiSettings): Promise<string> => {
    if (apiSettings.provider !== 'gemini') {
        console.warn(`Pembuatan video hanya didukung oleh Gemini. Beralih sementara ke penyedia Gemini.`);
    }
    const key = apiSettings.keys.gemini || API_KEY;
    if (!key) throw new Error("API Key Google Gemini dibutuhkan untuk membuat video.");
    // const ai = new GoogleGenAI({ apiKey: key });

    console.log("Generating video for prompt:", prompt);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Return a placeholder video URL
    return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
};

const YOUTUBE_METADATA_PROMPT = `
**PERAN DAN TUJUAN UTAMA**
Anda adalah "YouTube Growth Hacker & Content Strategist AI" yang sangat ahli dalam gaya bercerita personal yang disukai audiens drama Indonesia. Anda bertindak sebagai "Sahabat Pencerita". Tugas Anda adalah menghasilkan paket metadata YouTube yang dioptimalkan untuk engagement dan retensi.

**NASKAH UNTUK DIANALISIS:**
---
{script}
---

**TUGAS ANDA:**

1.  **Judul Utama:** Buat 1 judul utama yang paling kuat, emosional, dan memancing rasa penasaran, seolah-olah menceritakan sebuah rahasia.
2.  **Judul Alternatif (4 Opsi):** Buat 4 judul alternatif yang mengeksplorasi sudut pandang atau hook yang berbeda (misteri, transformasi, konflik).
3.  **Deskripsi Optimal (Struktur 3 Paragraf WAJIB):** Tulis deskripsi dengan gaya personal dan ramah:
    *   **Paragraf 1 (Hook Pembangun Rasa Penasaran):** JANGAN hanya mengulang judul. Mulailah dengan sebuah pertanyaan retoris atau pernyataan dramatis yang langsung menarik penonton ke dalam dunia cerita. Berikan gambaran awal tentang karakter dan masalahnya. Buat mereka berkomitmen untuk menonton. Contoh: "Pernahkah kalian bayangkan jika sebuah kejujuran justru membawa malapetaka? Inilah yang terjadi pada Elena, seorang gadis sederhana yang dunianya jungkir balik setelah menemukan sebuah surat wasiat misterius..."
    *   **Paragraf 2 (Sinopsis Tanpa Spoiler):** Ceritakan premis utama cerita tanpa membocorkan akhir atau twist penting. Fokus pada konflik dan apa yang dipertaruhkan oleh karakter utama. Gunakan gaya "Sahabat Pencerita" dengan sesekali menyapa penonton secara tidak langsung. Contoh: "Kini, Elena bukan lagi sekadar gadis biasa. Ia terlempar ke tengah-tengah keluarga serakah yang tak pernah ia kenal, dan kita semua tahu, tidak ada yang lebih berbahaya dari perebutan warisan..."
    *   **Paragraf 3 (CTA Personal & Ramah):** Akhiri dengan ajakan yang hangat untuk berinteraksi. Ajak mereka berdiskusi di komentar, lalu minta like dan subscribe. Contoh: "Kira-kira, apa yang bakal kalian lakuin kalau ada di posisi Elena? Coba tulis di kolom komentar ya, aku penasaran banget sama pendapat kalian! Jangan lupa juga untuk like video ini kalau kalian suka dan subscribe biar nggak ketinggalan kelanjutan kisah-kisah seru lainnya."
4.  **Hashtags (7 Opsi):** Buat 7 hashtag yang relevan. Campurkan 2-3 tag umum (misal: #dramaindonesia, #alurcerita) dengan 4-5 tag yang sangat spesifik tentang emosi atau tema cerita (misal: #balasdendam, #kisahsedih, #cintaterlarang).

**FORMAT OUTPUT (JSON):**
Hasilkan output dalam format JSON yang terstruktur sesuai skema yang diberikan.
`;

const youtubeMetadataSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        alternativeTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["title", "description", "hashtags", "alternativeTitles"],
};

export const generateYoutubeMetadata = async (script: string, apiSettings: ApiSettings): Promise<YoutubeMetadata> => {
    const prompt = YOUTUBE_METADATA_PROMPT.replace('{script}', script);
    let jsonText: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonText = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: youtubeMetadataSchema,
            }
        });
        jsonText = sanitizeJsonString(response.text);
    }

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse YouTube metadata JSON:", e, "Received:", jsonText);
        throw new Error(`Failed to generate YouTube metadata with ${apiSettings.provider}.`);
    }
};

const THUMBNAIL_PROMPTS_PROMPT = `
**System Instruction / Peran AI:**
Anda adalah seorang **Sutradara Seni AI Sinematik** yang berspesialisasi dalam menciptakan visual bergaya poster film drama Korea yang emosional dan berdampak tinggi. Tugas Anda adalah menghasilkan 3 prompt gambar yang sangat detail, artistik, dan yang paling penting, **KONSISTEN SECARA VISUAL** dengan karakter yang telah ditentukan, berdasarkan contoh-contoh masterclass.

**CONTEXT / INFORMASI YANG DISEDIAKAN:**
1.  **Judul Video:** {title}
2.  **Character Bible (SUMBER KEBENARAN TUNGGAL - WAJIB DIGUNAKAN SECARA KETAT):**
    ---
    {characters}
    ---
3.  **Naskah Cerita (Untuk Inspirasi Aksi & Emosi):**
    ---
    {script}
    ---

**TUGAS UTAMA: BUAT 3 PROMPT THUMBNAIL BERBEDA**
Anda harus membuat 3 variasi prompt yang unik dan sinematik. Setiap prompt HARUS mengikuti **Formula Emas 5-Lapis** yang telah disempurnakan di bawah ini, dengan meniru kedalaman dan detail dari contoh-contoh masterclass.

---
**FORMULA EMAS 5-LAPIS (VERSI SUTRADARA)**

**[Lapis 1: Gaya & Kualitas Visual]**
*   **Fondasi:** Selalu mulai dengan dasar ini: "Cinematic movie poster, inspired by Korean drama aesthetics, ultra-detailed 4K, sharp focus."
*   **Tingkatkan Suasana:** Tambahkan deskriptor mood spesifik seperti: "Moody Ensemble:", "Intimate Two-Shot:", atau "Hierarchical Group Shot:". Ini mengatur panggung untuk komposisi.

**[Lapis 2: Deskripsi Karakter KONSISTEN]**
*   **ATURAN EMAS (TIDAK BOLEH DILANGGAR):** Untuk setiap karakter dalam sebuah shot, Anda HARUS menyalin dan menempelkan **SELURUH** string deskripsi mereka dari "Character Bible". JANGAN PERNAH menyingkat, mengubah, atau meringkasnya. Konsistensi adalah segalanya.
*   Contoh Penggunaan: "...Fatimah, [seluruh consistencyString Fatimah di sini], is in the foreground... Bibi Dian, [seluruh consistencyString Bibi Dian di sini], and Siska, [seluruh consistencyString Siska di sini], are in the mid-ground..."

**[Lapis 3: Aksi & Emosi (Sutradara Psikologis)]**
*   **Gali Lebih Dalam:** Jangan hanya menyatakan emosi. Deskripsikan secara visual. Alih-alih "sedih", gunakan "a single tear track visible on her cheek, expressing profound loneliness". Alih-alih "jahat", gunakan "a sly, entitled smirk, full of casual cruelty".
*   **Ekspresi Mikro:** Tangkap emosi yang halus. Contoh: "her lower lip trembling almost imperceptibly, a micro-expression of profound hurt".
*   **Bahasa Tubuh:** Deskripsikan pose yang menceritakan sebuah kisah. Contoh: "her back partially turned, looking out a grand window with a vacant, melancholic stare", "sits on the opulent, cold marble floor, cleaning, looking down with downcast eyes".

**[Lapis 4: Sinematografi (Latar, Komposisi & Pencahayaan)]**
*   **Komposisi:** Gunakan istilah sinematik: "foreground", "mid-ground", "slightly off-center", "sharp profile", "looking directly at the camera".
*   **Pencahayaan Dramatis:** Jadilah spesifik. Gunakan teknik seperti: "Deep shadows and high contrast", "a single shaft of dramatic light illuminates Fatimah from the window, creating a halo effect", "Rembrandt lighting on Bibi Dian", "soft moody glow".
*   **Palet Warna:** Tentukan palet warna yang membangkitkan mood. Contoh: "Pallet of deep forest greens and desaturated purples, with strong, cold highlights", "Warm, desaturated sepia tones, evoking a sense of old pain".
*   **Lingkungan:** Deskripsikan latar belakang untuk memperkuat tema. Contoh: "The background is an expansive, dimly lit grand room of the house, with heavy curtains and ornate furniture, emphasizing the oppressive wealth".

**[Lapis 5: Teks & Detail Teknis]**
*   **Integrasi Judul:** Sertakan instruksi untuk judul. Contoh: "Features the title 'Penjara Emas' in a stylish minimalist serif, bottom left, white with a subtle glow."
*   **Spesifikasi Teknis:** Selalu akhiri dengan: "Widescreen (1792x1024)."
---

**ATURAN TAMBAHAN:**
*   **Buat 3 Opsi Berbeda:** Ciptakan 3 konsep thumbnail yang berbeda secara fundamental: 1. Shot grup yang menunjukkan dinamika kekuasaan. 2. Shot dua orang yang intim dan penuh emosi. 3. Shot close-up yang kuat pada satu karakter.
*   **Bahasa Inggris:** Semua prompt harus dalam Bahasa Inggris untuk hasil terbaik dari model gambar.

**FORMAT OUTPUT (JSON):**
Hasilkan sebuah array JSON yang valid, berisi 3 string prompt. Setiap string adalah satu prompt gambar lengkap yang siap pakai dan diformat dengan sempurna sesuai **Formula Emas (Versi Sutradara)**.
`;


const thumbnailPromptsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

export const generateThumbnailPrompts = async (script: string, characters: Character[], title: string, apiSettings: ApiSettings): Promise<string[]> => {
    const characterBible = formatCharactersForPrompt(characters);
    const prompt = THUMBNAIL_PROMPTS_PROMPT
        .replace('{script}', script)
        .replace('{characters}', characterBible)
        .replace('{title}', title || '');
        
    let jsonText: string;

    if (apiSettings.provider === 'groq') {
        const rawResponse = await callGroqAPI(prompt, apiSettings.keys.groq, true);
        jsonText = sanitizeJsonString(rawResponse);
    } else {
        const key = apiSettings.keys.gemini || API_KEY;
        if (!key) throw new Error("Gemini API Key is missing.");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: thumbnailPromptsSchema,
            }
        });
        jsonText = sanitizeJsonString(response.text);
    }

    try {
        const parsedResult = JSON.parse(jsonText);
        // Handle cases where the API might return an object with a key instead of a root array
        if (Array.isArray(parsedResult)) {
            return parsedResult;
        } else if (typeof parsedResult === 'object' && parsedResult !== null) {
            const arrayValue = Object.values(parsedResult).find(val => Array.isArray(val) && val.every(item => typeof item === 'string'));
            if (arrayValue) {
                return arrayValue as string[];
            }
        }
        console.warn("Received non-array for thumbnail prompts, attempting to use as is.", jsonText);
        // Fallback for unexpected but potentially valid single-string responses in an object
        if (typeof parsedResult === 'object' && parsedResult !== null && Object.values(parsedResult).length > 0) {
            return Object.values(parsedResult).map(String);
        }
        return [];

    } catch (e) {
        console.error("Failed to parse thumbnail prompts JSON:", e, "Received:", jsonText);
        throw new Error(`Failed to generate thumbnail prompts with ${apiSettings.provider}.`);
    }
};