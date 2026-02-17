import { BrickRegistry } from '@/core/brick'
import { useUIStore } from '@/store'
import { LEGO_COLORS, type BrickDefinition } from '@/types'

export function PartsPalette() {
  const selectedDefinitionId = useUIStore(state => state.selectedDefinitionId)
  const setSelectedDefinition = useUIStore(state => state.setSelectedDefinition)
  const setTool = useUIStore(state => state.setTool)
  const showPartsPalette = useUIStore(state => state.showPartsPalette)
  const selectedColorId = useUIStore(state => state.selectedColorId)

  if (!showPartsPalette) return null

  const bricks = BrickRegistry.getByCategory('basic')
  const plates = bricks.filter(b => b.dimensions.height === 1)
  const standardBricks = bricks.filter(b => b.dimensions.height === 3)

  const handleSelect = (definition: BrickDefinition) => {
    setSelectedDefinition(definition.id)
    setTool('place')
  }

  const selectedColor = LEGO_COLORS[selectedColorId] || LEGO_COLORS[4]

  return (
    <div style={styles.palette}>
      <h3 style={styles.title}>Parts</h3>

      <div style={styles.category}>
        <h4 style={styles.categoryTitle}>Bricks</h4>
        <div style={styles.grid}>
          {standardBricks.map(def => (
            <PartItem
              key={def.id}
              definition={def}
              isSelected={selectedDefinitionId === def.id}
              onSelect={() => handleSelect(def)}
              colorHex={selectedColor.hex}
            />
          ))}
        </div>
      </div>

      <div style={styles.category}>
        <h4 style={styles.categoryTitle}>Plates</h4>
        <div style={styles.grid}>
          {plates.map(def => (
            <PartItem
              key={def.id}
              definition={def}
              isSelected={selectedDefinitionId === def.id}
              onSelect={() => handleSelect(def)}
              colorHex={selectedColor.hex}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface PartItemProps {
  definition: BrickDefinition
  isSelected: boolean
  onSelect: () => void
  colorHex: string
}

function PartItem({ definition, isSelected, onSelect, colorHex }: PartItemProps) {
  const { dimensions } = definition
  const label = `${dimensions.width}x${dimensions.depth}`

  return (
    <button
      style={{
        ...styles.partItem,
        ...(isSelected ? styles.partItemSelected : {}),
      }}
      onClick={onSelect}
      title={definition.name}
    >
      <div style={styles.partPreview}>
        {/* Simple visual representation */}
        <div
          style={{
            width: Math.min(dimensions.width * 8, 40),
            height: Math.min(dimensions.depth * 8, 40),
            backgroundColor: colorHex,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.2)',
          }}
        />
      </div>
      <span style={styles.partLabel}>{label}</span>
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  palette: {
    position: 'absolute',
    left: 10,
    top: 70,
    width: 200,
    maxHeight: 'calc(100vh - 90px)',
    overflowY: 'auto',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  category: {
    marginBottom: 16,
  },
  categoryTitle: {
    margin: '0 0 8px 0',
    fontSize: 12,
    fontWeight: 500,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
  },
  partItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  partItemSelected: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  partPreview: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
}
