import { useEffect, useState } from 'react'

interface PromptModalProps {
  isOpen: boolean
  title: string
  message: string
  placeholder: string
  expectedValue: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  confirmButtonColor?: string
}

export function PromptModal({
  isOpen,
  title,
  message,
  placeholder,
  expectedValue,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonColor = '#ef4444'
}: PromptModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setInputValue('')
      setError('')
      // Debug: log the expected value
      console.log('Expected value:', expectedValue, 'Length:', expectedValue.length)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, expectedValue])

  const handleConfirm = () => {
    if (!expectedValue || expectedValue.trim() === '') {
      setError('Error: Expected value is empty. Please refresh and try again.')
      return
    }
    
    // Normalize both values: trim and normalize whitespace (multiple spaces/tabs/newlines to single space)
    const normalizeString = (str: string) => {
      return str.trim().replace(/\s+/g, ' ')
    }
    
    const normalizedInput = normalizeString(inputValue)
    const normalizedExpected = normalizeString(expectedValue)
    
    // Debug logging to help diagnose issues
    if (normalizedInput !== normalizedExpected) {
      console.log('=== Name Mismatch Debug ===')
      console.log('Raw Input:', JSON.stringify(inputValue))
      console.log('Raw Expected:', JSON.stringify(expectedValue))
      console.log('Normalized Input:', JSON.stringify(normalizedInput))
      console.log('Normalized Expected:', JSON.stringify(normalizedExpected))
      console.log('Input length:', normalizedInput.length)
      console.log('Expected length:', normalizedExpected.length)
      console.log('Character codes - Input:', Array.from(normalizedInput).map(c => c.charCodeAt(0)))
      console.log('Character codes - Expected:', Array.from(normalizedExpected).map(c => c.charCodeAt(0)))
    }
    
    if (normalizedInput !== normalizedExpected) {
      setError(`Name does not match.\n\nYou entered: "${inputValue.trim()}"\nExpected: "${expectedValue}"\n\nPlease copy the expected name above and paste it.`)
      return
    }
    onConfirm()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '20px'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '12px',
            marginTop: 0
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            marginBottom: '16px',
            whiteSpace: 'pre-line'
          }}
        >
          {message}
        </p>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setError('')
            }}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: error ? '2px solid #ef4444' : '1px solid var(--border)',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)'
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--border)'
              }
            }}
          />
          {error && (
            <p
              style={{
                fontSize: '12px',
                color: '#ef4444',
                marginTop: '8px',
                marginBottom: 0
              }}
            >
              {error}
            </p>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!inputValue.trim()}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              background: inputValue.trim() ? confirmButtonColor : '#ccc',
              color: 'white',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: inputValue.trim() ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
