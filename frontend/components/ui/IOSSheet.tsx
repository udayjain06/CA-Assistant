'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxHeight?: string
}

/**
 * Apple WWDC 2018 Rubber-band equation for soft boundary resistance (Principle 09)
 */
function rubberband(overshoot: number, dimension = 500, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

/**
 * Apple WWDC 2018 Momentum Projection (Principle 06)
 */
function projectMomentum(velocity: number, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate)
}

/**
 * iOS Bottom Sheet (Principles 02, 03, 04, 05, 06, 09, 10, 12, 14)
 * - Drag to dismiss with 1:1 tracking
 * - Rubber-band resistance at top boundary
 * - Spring damping 0.8, response 0.3
 * - Fully interruptible
 * - Translucent glass material
 */
export default function IOSSheet({ isOpen, onClose, title, children, maxHeight = '85vh' }: Props) {
  const [mounted, setMounted] = useState(false)
  const [dragY, setDragY] = useState<number | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startY: number
    currentY: number
    isDragging: boolean
    history: Array<{ y: number; time: number }>
  }>({ startY: 0, currentY: 0, isDragging: false, history: [] })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setDragY(null)
      setIsClosing(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const handleDismiss = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10)
    }
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setDragY(null)
      onClose()
    }, 280)
  }, [onClose])

  // Direct Manipulation & Pointer Gestures (Principles 02, 03, 10)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from handle or header area
    const target = e.target as HTMLElement
    if (target.closest('.sheet-content') && !target.closest('.sheet-drag-handle')) {
      return
    }

    // Principle 03: Interruptible — start from current presentation transform
    const liveY = dragY ?? 0
    dragRef.current = {
      startY: e.clientY - liveY,
      currentY: liveY,
      isDragging: true,
      history: [{ y: e.clientY, time: performance.now() }],
    }

    const el = e.currentTarget as HTMLElement
    el.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return

    const rawDelta = e.clientY - dragRef.current.startY

    // Add to velocity history (keep last 5 moves)
    const now = performance.now()
    dragRef.current.history.push({ y: e.clientY, time: now })
    if (dragRef.current.history.length > 5) {
      dragRef.current.history.shift()
    }

    let y = rawDelta
    if (y < 0) {
      // Principle 09: Rubber-band when pulled past top bound
      y = rubberband(y, 400, 0.55)
    }

    setDragY(y)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return
    dragRef.current.isDragging = false

    const el = e.currentTarget as HTMLElement
    try {
      el.releasePointerCapture?.(e.pointerId)
    } catch {
      // ignore
    }

    const currentY = dragY ?? 0
    const history = dragRef.current.history
    let velocity = 0

    // Principle 05: Velocity handoff
    if (history.length >= 2) {
      const oldest = history[0]
      const newest = history[history.length - 1]
      const dt = newest.time - oldest.time || 1
      velocity = ((newest.y - oldest.y) / dt) * 1000 // px per second
    }

    // Principle 06: Momentum projection
    const projectedLanding = currentY + projectMomentum(velocity) * 0.15

    // Dismiss if flicked downward (>250 px/s) or dragged past 110px
    if (velocity > 250 || currentY > 110 || projectedLanding > 140) {
      handleDismiss()
    } else {
      // Snap back to 0 with spring damping 0.8, response 0.3
      setDragY(0)
      setTimeout(() => setDragY(null), 240)
    }
  }

  if (!mounted || (!isOpen && !isClosing)) return null

  // Dynamic scrim opacity linked to drag
  const currentY = dragY ?? 0
  const backdropOpacity = currentY > 0 ? Math.max(0, 1 - currentY / 320) : 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal sheet'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Translucent Backdrop with Blur */}
      <div
        onClick={handleDismiss}
        className="ios-sheet-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: isClosing ? 0 : backdropOpacity,
          transition: dragY !== null ? 'none' : 'opacity 260ms var(--ease-spring)',
        }}
        aria-hidden="true"
      />

      {/* iOS Sheet Panel (Spring 0.8 / 0.3) */}
      <div
        ref={sheetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="ios-sheet-panel glass-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          maxHeight,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          background: 'rgba(22, 26, 35, 0.92)',
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.16)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          touchAction: 'none',
          transform: isClosing
            ? 'translateY(100%)'
            : dragY !== null
            ? `translateY(${dragY}px)`
            : 'translateY(0)',
          transition: dragY !== null
            ? 'none'
            : 'transform 280ms var(--spring-sheet)',
          animation: !dragY && !isClosing ? 'sheetSlideUp 300ms var(--spring-sheet) both' : undefined,
        }}
      >
        {/* Grab bar / Drag handle (Principle 02) */}
        <div
          className="sheet-drag-handle"
          style={{
            width: '100%',
            paddingTop: 10,
            paddingBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 36,
              height: 5,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.28)',
              transition: 'background 150ms var(--ease-spring)',
            }}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 20px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              userSelect: 'none',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
              {title}
            </h2>
            <button
              onClick={handleDismiss}
              aria-label="Close sheet"
              className="pressable"
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Content Area */}
        <div
          className="sheet-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: 20,
            touchAction: 'pan-y',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

