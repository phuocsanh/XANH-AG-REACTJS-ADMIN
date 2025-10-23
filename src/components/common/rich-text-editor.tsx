import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  showToolbar?: boolean;
}

/**
 * Component RichTextEditor tái sử dụng sử dụng TipTap
 * Cung cấp editor văn bản phong phú với toolbar formatting
 * Hỗ trợ Bold, Italic, Underline, Strikethrough
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  minHeight = 200,
  showToolbar = true,
}) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

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
  };

  const getActiveButtonStyle = (isActive: boolean) => ({
    ...toolbarButtonStyle,
    backgroundColor: isActive ? '#1890ff' : '#fff',
    color: isActive ? '#fff' : '#000',
    borderColor: isActive ? '#1890ff' : '#d9d9d9',
  });

  return (
    <div 
      style={{ 
        border: '1px solid #d9d9d9', 
        borderRadius: '6px',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div style={{ 
          borderBottom: '1px solid #d9d9d9', 
          padding: '8px 12px', 
          display: 'flex', 
          gap: '6px',
          backgroundColor: '#fafafa',
          borderRadius: '6px 6px 0 0',
        }}>
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

          {/* Divider */}
          <div style={{ 
            width: '1px', 
            height: '24px', 
            backgroundColor: '#d9d9d9', 
            margin: '0 4px' 
          }} />

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
        </div>
      )}
      
      {/* Editor Content */}
      <div style={{ 
        minHeight: `${minHeight}px`, 
        padding: '12px',
        backgroundColor: disabled ? '#f5f5f5' : '#fff',
      }}>
        <EditorContent 
          editor={editor} 
          style={{
            outline: 'none',
          }}
        />
        {/* Placeholder khi editor trống */}
        {editor.isEmpty && (
          <div style={{
            position: 'absolute',
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