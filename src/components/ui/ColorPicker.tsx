import { useUIStore } from '@/store'
import { DEFAULT_PALETTE_COLORS, type LegoColor } from '@/types'

export function ColorPicker() {
  const selectedColorId = useUIStore(state => state.selectedColorId)
  const setSelectedColor = useUIStore(state => state.setSelectedColor)

  return (
    <div style={styles.picker}>
      <h4 style={styles.title}>Color</h4>
      <div style={styles.grid}>
        {DEFAULT_PALETTE_COLORS.map(color => (
          <ColorSwatch
            key={color.id}
            color={color}
            isSelected={selectedColorId === color.id}
            onSelect={() => setSelectedColor(color.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface ColorSwatchProps {
  color: LegoColor
  isSelected: boolean
  onSelect: () => void
}

function ColorSwatch({ color, isSelected, onSelect }: ColorSwatchProps) {
  return (
    <button
      style={{
        ...styles.swatch,
        backgroundColor: color.hex,
        ...(isSelected ? styles.swatchSelected : {}),
      }}
      onClick={onSelect}
      title={color.name}
    />
  )
}

const styles: Record<string, React.CSSProperties> = {
  picker: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: 12,
    fontWeight: 500,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6,
  },
  swatch: {
    width: 28,
    height: 28,
    border: '2px solid #fff',
    borderRadius: 4,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.1s ease',
  },
  swatchSelected: {
    transform: 'scale(1.1)',
    boxShadow: '0 0 0 2px #2196f3, 0 2px 6px rgba(0, 0, 0, 0.3)',
  },
}
