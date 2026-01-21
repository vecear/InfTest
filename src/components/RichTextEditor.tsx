"use client";

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: EditorProps) {
    return (
        <div className="editor-container">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    height: '150px',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--glass-border)',
                    background: 'white',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    marginBottom: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                }}
            />
            <style jsx>{`
                textarea:focus {
                    border-color: var(--accent-color);
                }
            `}</style>
        </div>
    );
}
