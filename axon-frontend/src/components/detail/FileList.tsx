import type { BestPracticeFile } from '../../types';
import { bpApi } from '../../api/auth';

export function FileList({ files, bpId }: { files: BestPracticeFile[]; bpId: string }) {
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await bpApi.downloadFile(bpId, fileId);
      // Backend returns 302 Found with Location header
      // Since we follow redirects, we might get the file or a direct link
      window.open(res.config.url?.replace('/download', '/download'), '_blank');
      // Note: In real production, we'd handle the 302/Presigned URL specifically
      // but for this prototype, window.open to the download endpoint is sufficient
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Attachments ({files.length})</h3>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {files.map((file, idx) => (
          <div 
            key={file.id} 
            className={`flex items-center justify-between p-4 ${idx !== files.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">📄</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{file.fileName}</p>
                <p className="text-[10px] font-medium text-gray-400">
                  {(file.fileSize / 1024).toFixed(1)} KB • {file.mimeType}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleDownload(file.id, file.fileName)}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
              title="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="替代4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
