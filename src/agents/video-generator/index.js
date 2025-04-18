const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

class VideoGeneratorAgent {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'output');
  }

  async initialize() {
    // 出力ディレクトリの作成
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async generateVideo(prompt) {
    console.log(`Generating video for prompt: ${prompt}`);
    
    // 一意のファイル名を生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(this.outputDir, `video-${timestamp}.mp4`);

    try {
      // FFmpegを使用して動画を生成（サンプル実装）
      await this.generateSampleVideo(outputFile);
      
      return {
        status: 'success',
        outputFile,
        message: `Video generated successfully: ${outputFile}`
      };
    } catch (error) {
      console.error('Error generating video:', error);
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  }

  async generateSampleVideo(outputFile) {
    // FFmpegを使用してサンプル動画を生成
    // 黒い背景に白いテキストを表示する10秒の動画
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', 'color=c=black:s=1280x720:d=10',
        '-vf', `drawtext=text='Sample Video':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2`,
        '-c:v', 'libx264',
        '-t', '10',
        '-y',
        outputFile
      ]);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }
}

module.exports = VideoGeneratorAgent; 