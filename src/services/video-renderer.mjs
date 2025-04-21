import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export default class VideoRenderer {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    // FFmpegの存在確認
    try {
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        ffmpeg.on('error', reject);
        ffmpeg.on('close', code => {
          if (code === 0) resolve();
          else reject(new Error('FFmpeg check failed'));
        });
      });
      this.initialized = true;
    } catch (error) {
      throw new Error('FFmpegが見つかりません');
    }
  }

  async render(options) {
    if (!this.initialized) {
      throw new Error('VideoRendererが初期化されていません');
    }

    const {
      text,
      duration,
      imagePath,
      audioPath,
      subtitleStyle = {},
      quality = 'medium'
    } = options;

    // ファイルの存在確認
    try {
      await fs.access(imagePath);
    } catch (error) {
      throw new Error('画像ファイルが見つかりません');
    }

    try {
      await fs.access(audioPath);
    } catch (error) {
      throw new Error('音声ファイルが見つかりません');
    }

    // 字幕スタイルの設定
    const {
      fontSize = 32,
      fontColor = 'white',
      backgroundColor
    } = subtitleStyle;

    // FFmpegコマンドの構築
    const outputPath = path.join(process.cwd(), 'output', 'video', `output-${Date.now()}.mp4`);
    
    let drawTextFilter = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=(h-text_h)/2`;
    if (backgroundColor) {
      drawTextFilter += `:box=1:boxcolor=${backgroundColor}`;
    }

    // 品質設定
    const qualitySettings = {
      high: { preset: 'slow', crf: '18' },
      medium: { preset: 'medium', crf: '23' },
      low: { preset: 'fast', crf: '28' }
    }[quality];

    const ffmpegArgs = [
      '-loop', '1',
      '-i', imagePath,
      '-i', audioPath,
      '-c:v', 'libx264',
      '-preset', qualitySettings.preset,
      '-crf', qualitySettings.crf,
      '-c:a', 'aac',
      '-b:a', '192k',
      '-vf', drawTextFilter,
      '-shortest',
      '-t', duration.toString(),
      outputPath
    ];

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      ffmpeg.stderr.on('data', data => {
        console.error(`FFmpeg stderr: ${data}`);
      });

      ffmpeg.on('error', error => {
        reject(new Error('動画のレンダリングに失敗しました'));
      });

      ffmpeg.on('close', code => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error('動画のレンダリングに失敗しました'));
        }
      });
    });
  }
} 