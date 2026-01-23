import React, { useState } from 'react';

/**
 * AntigravityPromptEditor
 * A floating prompt editor component that defies gravity (stays fixed on screen).
 * 
 * Usage:
 * <AntigravityPromptEditor onSend={(text) => console.log(text)} />
 */
const AntigravityPromptEditor = ({ onSend, isOpen: initialIsOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [prompt, setPrompt] = useState('');

    const handleSend = () => {
        if (onSend) {
            onSend(prompt);
        }
        // Optional: Clear prompt after send
        // setPrompt('');
        setIsOpen(false);
    };

    const styles = {
        container: {
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        },
        editor: {
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            marginBottom: '1rem',
            width: '320px',
            display: isOpen ? 'block' : 'none',
            border: '1px solid #e5e7eb',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.2s ease-out',
        },
        textarea: {
            width: '100%',
            minHeight: '120px',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            marginBottom: '0.75rem',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            fontSize: '0.9rem',
        },
        button: {
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
        },
        fab: {
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '9999px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(45deg)' : 'none',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.editor}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem', color: '#1f2937' }}>Prompt Editor</h3>
                <textarea
                    style={styles.textarea}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={styles.button} onClick={handleSend}>Send Prompt</button>
                </div>
            </div>
            <button
                style={styles.fab}
                onClick={() => setIsOpen(!isOpen)}
                title={isOpen ? "Close Editor" : "Open Prompt Editor"}
            >
                +
            </button>
        </div>
    );
};

export default AntigravityPromptEditor;