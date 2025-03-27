import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import os from 'os';

export async function GET() {
  try {
    let diskInfo = {};
    
    // Informações do sistema operacional
    const osInfo = {
      platform: os.platform(),
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      arch: os.arch(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length
    };
    
    // Verifica o espaço em disco (método pode variar dependendo do sistema operacional)
    try {
      // Para sistemas Linux/Unix
      if (os.platform() === 'linux' || os.platform() === 'darwin') {
        const output = execSync('df -h /').toString();
        const lines = output.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          diskInfo = {
            filesystem: parts[0],
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usePercentage: parts[4],
            mountPoint: parts[5]
          };
        }
      } 
      // Para Windows
      else if (os.platform() === 'win32') {
        const output = execSync('wmic logicaldisk get size,freespace,caption').toString();
        const lines = output.trim().split('\n').filter(Boolean);
        if (lines.length > 1) {
          const diskData = {};
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].trim().split(/\s+/);
            if (parts.length >= 3) {
              const drive = parts[0];
              const freeSpace = parseInt(parts[1]);
              const size = parseInt(parts[2]);
              diskData[drive] = {
                size: formatBytes(size),
                freeSpace: formatBytes(freeSpace),
                used: formatBytes(size - freeSpace),
                usePercentage: `${Math.round((1 - freeSpace / size) * 100)}%`
              };
            }
          }
          diskInfo = diskData;
        }
      }
    } catch (diskError) {
      console.error('Erro ao obter informações de disco:', diskError);
      diskInfo = { error: 'Não foi possível obter informações do disco' };
    }
    
    return NextResponse.json({
      system: osInfo,
      disk: diskInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao obter informações do sistema:', error);
    
    return NextResponse.json({
      error: error.message || 'Erro desconhecido',
      message: 'Falha ao obter informações do sistema'
    }, { status: 500 });
  }
}

// Função auxiliar para formatar bytes em unidades legíveis
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 