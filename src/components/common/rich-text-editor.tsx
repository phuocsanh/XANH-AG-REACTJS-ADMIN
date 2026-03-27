import React, { useRef, useEffect } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { NodeSelection, Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { uploadService, UPLOAD_TYPES } from '@/services/upload.service';
import { PictureOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import { Spin, Modal, Radio, Space, Button, Tooltip } from 'antd';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  showToolbar?: boolean;
  uploadType?: string;
}

/**
 * Component xử lý hiển thị ảnh riêng biệt có thanh công cụ ngay tại ảnh
 */
const ImageNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, updateAttributes, deleteNode, selected } = props;
    const { src, width } = node.attrs;

    return (
        <NodeViewWrapper className="image-node-view" style={{ display: 'inline-block', width: width || '100%', position: 'relative', margin: '12px 0' }}>
            <img 
                src={src} 
                alt="" 
                style={{ 
                    width: '100%', 
                    borderRadius: '8px', 
                    display: 'block', 
                    cursor: 'pointer',
                    outline: selected ? '3px solid #1890ff' : 'none',
                    boxShadow: selected ? '0 0 10px rgba(24, 144, 255, 0.5)' : 'none',
                    transition: 'all 0.2s ease'
                }} 
            />
            
            {/* Thanh công cụ hiện ngay bên cạnh / trên ảnh khi được chọn */}
            {selected && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '4px',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 20,
                    border: '1px solid #1890ff'
                }}>
                    <Button.Group size="small">
                        <Button onClick={() => updateAttributes({ width: '25%' })} type={width === '25%' ? 'primary' : 'default'} style={{ fontSize: '11px' }}>25%</Button>
                        <Button onClick={() => updateAttributes({ width: '50%' })} type={width === '50%' ? 'primary' : 'default'} style={{ fontSize: '11px' }}>50%</Button>
                        <Button onClick={() => updateAttributes({ width: '75%' })} type={width === '75%' ? 'primary' : 'default'} style={{ fontSize: '11px' }}>75%</Button>
                        <Button onClick={() => updateAttributes({ width: '100%' })} type={width === '100%' ? 'primary' : 'default'} style={{ fontSize: '11px' }}>100%</Button>
                    </Button.Group>
                    <Tooltip title="Xóa ảnh">
                        <Button 
                            size="small" 
                            danger 
                            type="primary"
                            icon={<DeleteOutlined />} 
                            onClick={deleteNode}
                        />
                    </Tooltip>
                </div>
            )}
        </NodeViewWrapper>
    );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  minHeight = 400,
  showToolbar = true,
  uploadType = UPLOAD_TYPES.COMMON,
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [pendingImageUrl, setPendingImageUrl] = React.useState<string | null>(null);
  const [selectedWidth, setSelectedWidth] = React.useState('100%');
  const [showSizeModal, setShowSizeModal] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure(), 
      Underline.configure(),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: '100%',
              renderHTML: attributes => ({
                width: attributes.width,
                style: `width: ${attributes.width}; max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block;`
              }),
            },
          }
        },
        selectable: true,
        draggable: true,
        // Sử dụng custom renderer để hiển thị thanh công cụ ngay tại ảnh
        addNodeView() {
            return ReactNodeViewRenderer(ImageNodeView);
        },
        addProseMirrorPlugins() {
          return [
            new Plugin({
              props: {
                handleClickOn(view, pos, node) {
                  if (node.type.name === 'image') {
                    const selection = NodeSelection.create(view.state.doc, pos);
                    view.dispatch(view.state.tr.setSelection(selection));
                    return true;
                  }
                  return false;
                },
              },
            }),
          ];
        },
      }).configure({
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-agri-600 underline hover:text-agri-700 transition-colors',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'focus:outline-none'
        }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await uploadService.uploadImage(file, uploadType as any);
      if (response && response.url) {
        setPendingImageUrl(response.url);
        setShowSizeModal(true);
      }
    } catch (error) {
      console.error('Lỗi khi chèn ảnh vào editor:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toolbarButtonStyle = {
    padding: '6px 10px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#000',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
  };

  const getActiveButtonStyle = (isActive: boolean) => ({
    ...toolbarButtonStyle,
    backgroundColor: isActive ? '#1890ff' : '#fff',
    color: isActive ? '#fff' : '#000',
    borderColor: isActive ? '#1890ff' : '#d9d9d9',
  });

  const confirmInsertImage = () => {
    if (pendingImageUrl && editor) {
      editor.chain().focus().setImage({ 
        src: pendingImageUrl,
        // @ts-ignore
        width: selectedWidth 
      }).run();
    }
    setShowSizeModal(false);
    setPendingImageUrl(null);
  };

  const updateImageWidth = (width: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', { width }).run();
  };

  const deleteImage = () => {
    if (!editor) return;
    editor.chain().focus().deleteSelection().run(); // Sử dụng deleteSelection để xóa node đang chọn
  };

  return (
    <div className="rich-text-editor-wrapper" style={{ border: '1px solid #d9d9d9', borderRadius: '6px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror {
            outline: none;
            min-height: ${minHeight}px;
            padding: 12px;
            background-color: ${disabled ? '#f5f5f5' : '#fff'};
          }
        `}
      </style>

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />

      {/* Toolbar - STICKY at top */}
      {showToolbar && (
        <div style={{ 
          borderBottom: '1px solid #d9d9d9', 
          padding: '8px 12px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px', 
          backgroundColor: '#fafafa',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
           <button type="button" onClick={() => !disabled && editor.chain().focus().toggleHeading({ level: 2 }).run()} style={getActiveButtonStyle(editor.isActive('heading', { level: 2 }))}>H2</button>
           <button type="button" onClick={() => !disabled && editor.chain().focus().toggleHeading({ level: 3 }).run()} style={getActiveButtonStyle(editor.isActive('heading', { level: 3 }))}>H3</button>
           
           <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 4px' }} />
           
           <button type="button" onClick={() => !disabled && editor.chain().focus().toggleBold().run()} style={getActiveButtonStyle(editor.isActive('bold'))}><strong>B</strong></button>
           <button type="button" onClick={() => !disabled && editor.chain().focus().toggleItalic().run()} style={getActiveButtonStyle(editor.isActive('italic'))}><em>I</em></button>
           <button type="button" onClick={() => !disabled && editor.chain().focus().toggleUnderline().run()} style={getActiveButtonStyle(editor.isActive('underline'))}>U</button>
           
           <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 4px' }} />
           
           <button type="button" onClick={() => !disabled && editor.chain().focus().toggleBulletList().run()} style={getActiveButtonStyle(editor.isActive('bulletList'))}>•</button>
           <button type="button" onClick={() => !disabled && editor.chain().focus().toggleOrderedList().run()} style={getActiveButtonStyle(editor.isActive('orderedList'))}>1.</button>

           <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 4px' }} />

           <button type="button" onClick={() => !disabled && fileInputRef.current?.click()} style={toolbarButtonStyle} title="Chèn ảnh">
             {isUploading ? <LoadingOutlined /> : <PictureOutlined />}
           </button>

           {/* Fallback cho Toolbar khi chọn ảnh */}
           {editor.isActive('image') && !disabled && (
             <div style={{ 
                display: 'flex', 
                gap: '4px', 
                marginLeft: 'auto', 
                backgroundColor: '#fffbe6', 
                padding: '2px 8px', 
                borderRadius: '6px', 
                border: '1px solid #ffe58f',
                boxShadow: '0 0 5px rgba(255, 229, 143, 0.5)'
             }}>
               <span style={{ fontSize: '11px', alignSelf: 'center', marginRight: 4, color: '#874d00', fontWeight: 'bold' }}>CÔNG CỤ ẢNH:</span>
               <button type="button" onClick={() => updateImageWidth('25%')} style={toolbarButtonStyle}>25%</button>
               <button type="button" onClick={() => updateImageWidth('50%')} style={toolbarButtonStyle}>50%</button>
               <button type="button" onClick={() => updateImageWidth('75%')} style={toolbarButtonStyle}>75%</button>
               <button type="button" onClick={() => updateImageWidth('100%')} style={toolbarButtonStyle}>100%</button>
               <div style={{ width: '1px', height: '100%', backgroundColor: '#ffe58f', margin: '0 2px' }} />
               <button type="button" onClick={deleteImage} style={{ ...toolbarButtonStyle, backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }} title="Xóa ảnh">Xóa</button>
             </div>
           )}
        </div>
      )}

      {/* Editor Content Area */}
      <div style={{ position: 'relative', flex: 1 }}>
        {isUploading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 10 }}>
            <Spin tip="Đang tải ảnh lên..." />
          </div>
        )}
        <EditorContent editor={editor} className="tiptap-editor-content" />
        {editor.isEmpty && !isUploading && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', color: '#bfbfbf', pointerEvents: 'none', fontSize: '14px' }}>
            {placeholder}
          </div>
        )}
      </div>

      <Modal title="Tùy chỉnh kích thước ảnh" open={showSizeModal} onOk={confirmInsertImage} onCancel={() => setShowSizeModal(false)} okText="Chèn ảnh" cancelText="Hủy" width={400}>
         <Radio.Group value={selectedWidth} onChange={(e) => setSelectedWidth(e.target.value)} buttonStyle="solid" style={{ width: '100%', textAlign: 'center' }}>
            <Space direction="vertical" style={{ width: '100%', marginTop: 10 }}>
              <Radio.Button value="25%" style={{ width: '100%', textAlign: 'center' }}>Nhỏ (25%)</Radio.Button>
              <Radio.Button value="50%" style={{ width: '100%', textAlign: 'center' }}>Trung bình (50%)</Radio.Button>
              <Radio.Button value="75%" style={{ width: '100%', textAlign: 'center' }}>Lớn (75%)</Radio.Button>
              <Radio.Button value="100%" style={{ width: '100%', textAlign: 'center' }}>Gốc (100%)</Radio.Button>
            </Space>
         </Radio.Group>
      </Modal>
    </div>
  );
};

export default RichTextEditor;