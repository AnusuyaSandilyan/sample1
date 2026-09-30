import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, ShieldCheck, Receipt } from 'lucide-react';

export const ExcelUploader = ({ onFileUpload, onReceiptUpload }) => {
  const fileInputRef = useRef(null);
  const receiptInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setUploading(true);
    await onFileUpload(file);
    setUploading(false);
  };

  return (
    <section className="card">
      <div 
        className={`drop-zone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange} 
          hidden 
        />
        <div className="drop-zone-content">
          <div className="upload-icon-wrapper">
            <UploadCloud size={32} className="upload-icon" />
          </div>
          <h3>{uploading ? 'Parsing Excel Sheet...' : 'Upload your Expense Excel Sheet'}</h3>
          <p>Drag & drop <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> file here or <span className="browse-link">Browse Files</span></p>
          <div className="file-badges">
            <span className="badge"><CheckCircle2 size={14} /> Smart Column Mapping</span>
            <span className="badge"><ShieldCheck size={14} /> Automated Due Date Tracking</span>
          </div>
        </div>
      </div>

      <div className="receipt-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Receipt size={18} className="text-amber" />
          <span>Upload Payment Log / Receipts Sheet to Auto-Mark Matching Expenses as Paid</span>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          onClick={() => receiptInputRef.current?.click()}
        >
          Select Receipt Sheet
        </button>
        <input 
          type="file" 
          ref={receiptInputRef} 
          accept=".xlsx, .xls, .csv" 
          onChange={(e) => e.target.files[0] && onReceiptUpload(e.target.files[0])} 
          hidden 
        />
      </div>
    </section>
  );
};
