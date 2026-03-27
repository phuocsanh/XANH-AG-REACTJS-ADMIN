import React, { useRef, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { uploadService, UPLOAD_TYPES } from '@/services/upload.service';
import { PictureOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import { Spin, Modal, Radio, Space, Button, Tooltip, Divider } from 'antd';

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
 * Component RichTextEditor tái sử dụng sử dụng TipTap
 * Cung cấp editor văn bản phong phú với toolbar formatting và chèn ảnh
 */
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
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handleClickOn: (view, pos, node) => {
        if (node.type.name === 'image') {
          const selection = NodeSelection.create(view.state.doc, pos);
          view.dispatch(view.state.tr.setSelection(selection));
          return true;
        }
        return false;
      },
    },
  });

  // Đồng bộ content khi props thay đổi từ bên ngoài (ví dụ: khi load dữ liệu chỉnh sửa)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  // Xử lý upload ảnh và chèn vào editor
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await uploadService.uploadImage(file, uploadType as any);
      
      if (response && response.url) {
        // Thay vì chèn ngay, mở modal chọn kích thước
        setPendingImageUrl(response.url);
        setShowSizeModal(true);
      }
    } catch (error) {
      console.error('Lỗi khi chèn ảnh vào editor:', error);
    } finally {
      setIsUploading(false);
      // Reset input để có thể chọn lại cùng 1 file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Các nút toolbar với styling nhất quán
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
        // @ts-ignore - width is added via extend
        width: selectedWidth 
      }).run();
    }
    setShowSizeModal(false);
    setPendingImageUrl(null);
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Nhập địa chỉ liên kết (URL):', previousUrl);

    // Cancelled
    if (url === null) {
      return;
    }

    // Empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const updateImageWidth = (width: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', { width }).run();
  };

  const deleteImage = () => {
    if (!editor) return;
    // Xóa node ảnh đang được chọn
    editor.chain().focus().deleteNode('image').run();
  };

  return (
    <div 
      className="rich-text-editor-wrapper"
      style={{ 
        border: '1px solid #d9d9d9', 
        borderRadius: '6px',
        opacity: disabled ? 0.6 : 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* CSS cho editor để xử lý linh hoạt */}
      <style>
        {`
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror {
            outline: none;
            min-height: ${minHeight}px;
            padding: 12px;
            background-color: ${disabled ? '#f5f5f5' : '#fff'};
            border-bottom-left-radius: 6px;
            border-bottom-right-radius: 6px;
          }
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            color: #1a1a1a;
            line-height: 1.3;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 4px;
          }
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1.25rem;
            margin-bottom: 0.75rem;
            color: #333;
            line-height: 1.4;
          }
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror p {
            margin-bottom: 0.8em;
            font-size: 14px;
            color: #4b5563;
          }
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 12px 0;
            display: block;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror img.ProseMirror-selectednode {
            outline: 3px solid #1890ff;
            box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
          }
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror ul, 
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror ol {
            padding-left: 1.5em;
            margin-bottom: 1em;
          }
          /* Focus style for active heading */
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror h2.ProseMirror-focused,
          .rich-text-editor-wrapper .tiptap-editor-content .ProseMirror h3.ProseMirror-focused {
            outline: none;
          }
        `}
      </style>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        accept="image/*"
      />

      {/* Toolbar */}
      {showToolbar && (
        <div style={{ 
          borderBottom: '1px solid #d9d9d9', 
          padding: '8px 12px', 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '6px',
          backgroundColor: '#fafafa',
          borderRadius: '6px 6px 0 0',
        }}>
          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleHeading({ level: 2 }).run()}
            style={{
              ...getActiveButtonStyle(editor.isActive('heading', { level: 2 })),
              fontWeight: 'bold',
            }}
            disabled={disabled}
            title="Heading 2 (Tiêu đề chính)"
          >
            H2
          </button>

          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleHeading({ level: 3 }).run()}
            style={{
              ...getActiveButtonStyle(editor.isActive('heading', { level: 3 })),
              fontWeight: 'bold',
            }}
            disabled={disabled}
            title="Heading 3 (Tiêu đề phụ)"
          >
            H3
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 4px' }} />

          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleBold().run()}
            style={getActiveButtonStyle(editor.isActive('bold'))}
            disabled={disabled}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          
          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleItalic().run()}
            style={{
              ...getActiveButtonStyle(editor.isActive('italic')),
              fontStyle: 'italic',
            }}
            disabled={disabled}
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          
          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleUnderline().run()}
            style={{
              ...getActiveButtonStyle(editor.isActive('underline')),
              textDecoration: 'underline',
            }}
            disabled={disabled}
            title="Underline (Ctrl+U)"
          >
            U
          </button>
          
          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleStrike().run()}
            style={{
              ...getActiveButtonStyle(editor.isActive('strike')),
              textDecoration: 'line-through',
            }}
            disabled={disabled}
            title="Strikethrough"
          >
            S
          </button>

          <button
            type="button"
            onClick={() => !disabled && setLink()}
            style={getActiveButtonStyle(editor.isActive('link'))}
            disabled={disabled}
            title="Chèn liên kết"
          >
            <span style={{ fontSize: '16px' }}>🔗</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 4px' }} />

          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleBulletList().run()}
            style={getActiveButtonStyle(editor.isActive('bulletList'))}
            disabled={disabled}
            title="Bullet List"
          >
            •
          </button>

          <button
            type="button"
            onClick={() => !disabled && editor.chain().focus().toggleOrderedList().run()}
            style={getActiveButtonStyle(editor.isActive('orderedList'))}
            disabled={disabled}
            title="Numbered List"
          >
            1.
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 4px' }} />

          <button
            type="button"
            onClick={() => !disabled && fileInputRef.current?.click()}
            style={toolbarButtonStyle}
            disabled={disabled || isUploading}
            title="Chèn ảnh vào vị trí con trỏ"
          >
            {isUploading ? <LoadingOutlined /> : <PictureOutlined style={{ fontSize: '16px' }} />}
          </button>

          {/* Công cụ cho ẢNH KHI ĐƯỢC CHỌN (Resizing & Deleting) ở Toolbar */}
          {editor.isActive('image') && !disabled && (
            <>
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 4px' }} />
              
              <div style={{ display: 'flex', gap: '2px', backgroundColor: '#e6f7ff', padding: '2px', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                <button
                  type="button"
                  onClick={() => updateImageWidth('25%')}
                  style={{ ...toolbarButtonStyle, fontSize: '10px', height: '26px', minWidth: '40px' }}
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => updateImageWidth('50%')}
                  style={{ ...toolbarButtonStyle, fontSize: '10px', height: '26px', minWidth: '40px' }}
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => updateImageWidth('75%')}
                  style={{ ...toolbarButtonStyle, fontSize: '10px', height: '26px', minWidth: '40px' }}
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => updateImageWidth('100%')}
                  style={{ ...toolbarButtonStyle, fontSize: '10px', height: '26px', minWidth: '40px' }}
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={deleteImage}
                  style={{ ...toolbarButtonStyle, backgroundColor: '#fff1f0', color: '#f5222d', borderColor: '#ffa39e', height: '26px', minWidth: '40px' }}
                >
                  Xóa
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal chọn kích thước ảnh (khi upload mới) */}
      <Modal
        title="Tùy chỉnh kích thước ảnh"
        open={showSizeModal}
        onOk={confirmInsertImage}
        onCancel={() => setShowSizeModal(false)}
        okText="Chèn ảnh"
        cancelText="Hủy"
        width={400}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p>Chọn kích thước hiển thị trong bài viết:</p>
          <Radio.Group 
            value={selectedWidth} 
            onChange={(e) => setSelectedWidth(e.target.value)}
            buttonStyle="solid"
          >
            <Space direction="vertical" style={{ width: '100%', marginTop: 10 }}>
              <Radio.Button value="25%" style={{ width: '100%', textAlign: 'center' }}>Nhỏ (25%)</Radio.Button>
              <Radio.Button value="50%" style={{ width: '100%', textAlign: 'center' }}>Trung bình (50%)</Radio.Button>
              <Radio.Button value="75%" style={{ width: '100%', textAlign: 'center' }}>Lớn (75%)</Radio.Button>
              <Radio.Button value="100%" style={{ width: '100%', textAlign: 'center' }}>Gốc (100%)</Radio.Button>
            </Space>
          </Radio.Group>
        </div>
        {pendingImageUrl && (
          <div style={{ 
            marginTop: 15, 
            border: '1px solid #f0f0f0', 
            borderRadius: 8, 
            padding: 8,
            backgroundColor: '#f9f9f9',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <img 
              src={pendingImageUrl} 
              alt="Preview" 
              style={{ width: selectedWidth, maxHeight: 200, objectFit: 'contain', transition: 'width 0.3s ease' }} 
            />
          </div>
        )}
      </Modal>
      
      {/* Editor Content Area */}
      <div style={{ position: 'relative', flex: 1 }}>
        {isUploading && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
          }}>
            <Spin tip="Đang tải ảnh lên..." />
          </div>
        )}

        {/* BUBBLE MENU CHO ẢNH - Hiện ngay trên tấm ảnh khi được chọn */}
        {editor && (
          <BubbleMenu 
            editor={editor} 
            shouldShow={({ editor }) => editor.isActive('image')}
            tippyOptions={{ duration: 100, placement: 'top', offset: [0, 10] }}
          >
            <div className="bg-white p-1 rounded-lg shadow-xl border border-blue-200 flex items-center gap-1">
              <Tooltip title="25%">
                <Button size="small" onClick={() => updateImageWidth('25%')}>25%</Button>
              </Tooltip>
              <Tooltip title="50%">
                <Button size="small" onClick={() => updateImageWidth('50%')}>50%</Button>
              </Tooltip>
              <Tooltip title="75%">
                <Button size="small" onClick={() => updateImageWidth('75%')}>75%</Button>
              </Tooltip>
              <Tooltip title="100%">
                <Button size="small" onClick={() => updateImageWidth('100%')}>100%</Button>
              </Tooltip>
              <Divider type="vertical" />
              <Tooltip title="Xóa ảnh">
                <Button 
                  size="small" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={deleteImage}
                />
              </Tooltip>
            </div>
          </BubbleMenu>
        )}
        
        <EditorContent 
          editor={editor} 
          className="tiptap-editor-content"
        />
        
        {/* Placeholder */}
        {editor.isEmpty && !isUploading && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            color: '#bfbfbf',
            pointerEvents: 'none',
            fontSize: '14px',
          }}>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;