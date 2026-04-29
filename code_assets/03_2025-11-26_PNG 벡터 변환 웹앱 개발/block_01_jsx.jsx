import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Palette, Maximize2, Activity, Settings } from 'lucide-react';

export default function PngToVectorConverter() {
  const [image, setImage] = useState(null);
  const [svgResult, setSvgResult] = useState('');
  const [mode, setMode] = useState('posterize');
  const [processing, setProcessing] = useState(false);
  const [params, setParams] = useState({
    colorCount: 8,
    threshold: 128,
    blur: 1,
    minSize: 10
  });
  const fileInputRef = useRef(null);

  const modes = [
    { id: 'posterize', name: '포스터화', icon: Palette, desc: '로고/아이콘에 최적' },
    { id: 'edge', name: '윤곽선', icon: Activity, desc: '선화 추출' },
    { id: 'detailed', name: '상세 변환', icon: ImageIcon, desc: '사진 벡터화' },
    { id: 'simplified', name: '단순화', icon: Maximize2, desc: '최소 디테일' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setSvgResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setSvgResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processImage = async () => {
    if (!image) return;
    
    setProcessing(true);
    
    try {
      const img = new Image();
      img.src = image;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let svg = '';

      switch (mode) {
        case 'posterize':
          svg = createPosterizedSVG(imageData, params.colorCount);
          break;
        case 'edge':
          svg = createEdgeSVG(imageData, params.threshold);
          break;
        case 'detailed':
          svg = createDetailedSVG(imageData, params.colorCount * 2);
          break;
        case 'simplified':
          svg = createSimplifiedSVG(imageData, params.minSize);
          break;
      }

      setSvgResult(svg);
    } catch (error) {
      console.error('처리 중 오류:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const createPosterizedSVG = (imageData, colorCount) => {
    const { width, height, data } = imageData;
    const colorMap = new Map();
    
    // 색상 양자화 및 수집
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        if (a < 10) continue;
        
        const qr = Math.round(r / 255 * (colorCount - 1)) * Math.floor(255 / (colorCount - 1));
        const qg = Math.round(g / 255 * (colorCount - 1)) * Math.floor(255 / (colorCount - 1));
        const qb = Math.round(b / 255 * (colorCount - 1)) * Math.floor(255 / (colorCount - 1));
        
        const color = `rgb(${qr},${qg},${qb})`;
        if (!colorMap.has(color)) {
          colorMap.set(color, []);
        }
        colorMap.get(color).push({ x, y });
      }
    }
    
    // SVG 생성
    let paths = '';
    colorMap.forEach((pixels, color) => {
      if (pixels.length < params.minSize) return;
      
      const rects = groupPixelsIntoRects(pixels);
      rects.forEach(rect => {
        paths += `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${color}"/>\n`;
      });
    });
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${paths}</svg>`;
  };

  const createEdgeSVG = (imageData, threshold) => {
    const { width, height, data } = imageData;
    const edges = [];
    
    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        let gx = 0, gy = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = ((y + dy) * width + (x + dx)) * 4;
            const ngray = (data[nidx] + data[nidx + 1] + data[nidx + 2]) / 3;
            gx += ngray * (dx === -1 ? -1 : dx === 1 ? 1 : 0);
            gy += ngray * (dy === -1 ? -1 : dy === 1 ? 1 : 0);
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        if (magnitude > threshold) {
          edges.push({ x, y });
        }
      }
    }
    
    // 점들을 선으로 연결
    let paths = '<path d="';
    edges.forEach(point => {
      paths += `M${point.x},${point.y} L${point.x + 1},${point.y} `;
    });
    paths += '" stroke="#0c3026" stroke-width="1" fill="none"/>';
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${paths}\n</svg>`;
  };

  const createDetailedSVG = (imageData, colorCount) => {
    return createPosterizedSVG(imageData, colorCount);
  };

  const createSimplifiedSVG = (imageData, minSize) => {
    return createPosterizedSG(imageData, 4);
  };

  const groupPixelsIntoRects = (pixels) => {
    const rects = [];
    const used = new Set();
    
    pixels.forEach(pixel => {
      const key = `${pixel.x},${pixel.y}`;
      if (used.has(key)) return;
      
      let width = 1;
      let height = 1;
      
      // 가로 확장
      while (pixels.some(p => p.x === pixel.x + width && p.y === pixel.y && !used.has(`${p.x},${p.y}`))) {
        width++;
      }
      
      // 세로 확장
      let canExtendHeight = true;
      while (canExtendHeight) {
        for (let w = 0; w < width; w++) {
          if (!pixels.some(p => p.x === pixel.x + w && p.y === pixel.y + height && !used.has(`${p.x},${p.y}`))) {
            canExtendHeight = false;
            break;
          }
        }
        if (canExtendHeight) height++;
      }
      
      // 사용된 픽셀 마킹
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          used.add(`${pixel.x + w},${pixel.y + h}`);
        }
      }
      
      rects.push({ x: pixel.x, y: pixel.y, w: width, h: height });
    });
    
    return rects;
  };

  const downloadSVG = () => {
    if (!svgResult) return;
    
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-${mode}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0c3026',
      color: '#e8f5f2',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #cce3dd, #00a1b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            PNG → Vector 변환기
          </h1>
          <p style={{ color: '#94b8aa', fontSize: '1.1rem' }}>
            이미지를 벡터 그래픽(SVG)으로 변환
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
          {/* 왼쪽 컨트롤 패널 */}
          <div>
            {/* 이미지 업로드 */}
            <div style={{
              background: '#0d3a2d',
              border: '1px solid #1a5040',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                color: '#8dccd3',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                <Upload size={20} />
                이미지 업로드
              </div>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{
                  border: '2px dashed #54b7c6',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(0, 161, 184, 0.05)',
                  transition: 'all 0.2s'
                }}
              >
                <ImageIcon size={48} style={{ color: '#54b7c6', margin: '0 auto 1rem' }} />
                <p style={{ color: '#b2d9d8', marginBottom: '0.5rem' }}>
                  클릭하거나 파일을 드래그하세요
                </p>
                <p style={{ fontSize: '0.85rem', color: '#94b8aa' }}>
                  PNG, JPG, GIF, WebP
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* 변환 모드 선택 */}
            <div style={{
              background: '#0d3a2d',
              border: '1px solid #1a5040',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                color: '#8dccd3',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                <Settings size={20} />
                변환 모드
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {modes.map(m => {
                  const Icon = m.icon;
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: isActive ? 'rgba(0, 161, 184, 0.2)' : 'rgba(0, 161, 184, 0.05)',
                        border: `2px solid ${isActive ? '#00a1b8' : '#1a5040'}`,
                        borderRadius: '8px',
                        color: isActive ? '#cce3dd' : '#94b8aa',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.95rem',
                        textAlign: 'left'
                      }}
                    >
                      <Icon size={20} style={{ color: isActive ? '#00a1b8' : '#54b7c6' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 파라미터 설정 */}
            <div style={{
              background: '#0d3a2d',
              border: '1px solid #1a5040',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                color: '#8dccd3',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                상세 설정
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mode === 'posterize' || mode === 'detailed' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#b2d9d8', fontSize: '0.9rem' }}>
                      색상 수: {params.colorCount}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="16"
                      value={params.colorCount}
                      onChange={(e) => setParams({ ...params, colorCount: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: '#00a1b8' }}
                    />
                  </div>
                ) : null}
                
                {mode === 'edge' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#b2d9d8', fontSize: '0.9rem' }}>
                      감도: {params.threshold}
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={params.threshold}
                      onChange={(e) => setParams({ ...params, threshold: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: '#00a1b8' }}
                    />
                  </div>
                ) : null}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#b2d9d8', fontSize: '0.9rem' }}>
                    최소 크기: {params.minSize}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={params.minSize}
                    onChange={(e) => setParams({ ...params, minSize: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: '#00a1b8' }}
                  />
                </div>
              </div>
            </div>

            {/* 변환 버튼 */}
            <button
              onClick={processImage}
              disabled={!image || processing}
              style={{
                width: '100%',
                padding: '1rem',
                background: image && !processing 
                  ? 'linear-gradient(135deg, #00a1b8, #017f97)' 
                  : '#1a5040',
                border: 'none',
                borderRadius: '8px',
                color: '#e8f5f2',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: image && !processing ? 'pointer' : 'not-allowed',
                opacity: image && !processing ? 1 : 0.5,
                transition: 'all 0.2s',
                marginBottom: '1rem'
              }}
            >
              {processing ? '변환 중...' : '벡터로 변환'}
            </button>

            {/* 다운로드 버튼 */}
            {svgResult && (
              <button
                onClick={downloadSVG}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(0, 161, 184, 0.2)',
                  border: '2px solid #00a1b8',
                  borderRadius: '8px',
                  color: '#cce3dd',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <Download size={20} />
                SVG 다운로드
              </button>
            )}
          </div>

          {/* 오른쪽 미리보기 */}
          <div style={{
            background: '#0d3a2d',
            border: '1px solid #1a5040',
            borderRadius: '12px',
            padding: '2rem',
            minHeight: '600px'
          }}>
            <div style={{
              color: '#8dccd3',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              미리보기
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: svgResult ? '1fr 1fr' : '1fr',
              gap: '2rem'
            }}>
              {/* 원본 이미지 */}
              {image && (
                <div>
                  <div style={{ color: '#b2d9d8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    원본
                  </div>
                  <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={image}
                      alt="원본"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px',
                        display: 'block'
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* 변환 결과 */}
              {svgResult && (
                <div>
                  <div style={{ color: '#b2d9d8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    벡터 (SVG)
                  </div>
                  <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div
                      dangerouslySetInnerHTML={{ __html: svgResult }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px'
                      }}
                    />
                  </div>
                </div>
              )}
              
              {!image && !svgResult && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '400px',
                  color: '#94b8aa',
                  fontSize: '1.1rem'
                }}>
                  이미지를 업로드하여 시작하세요
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
