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

  // Get bricks by category
  const basicBricks = BrickRegistry.getByCategory('basic')
  const slopeBricks = BrickRegistry.getByCategory('slope')
  const roundBricks = BrickRegistry.getByCategory('round')

  // Subdivide basic bricks
  const plates = basicBricks.filter(b => b.dimensions.height === 1)
  const standardBricks = basicBricks.filter(b => b.dimensions.height === 3)

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

      {slopeBricks.length > 0 && (
        <div style={styles.category}>
          <h4 style={styles.categoryTitle}>Slopes</h4>
          <div style={styles.grid}>
            {slopeBricks.map(def => (
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
      )}

      {roundBricks.length > 0 && (
        <div style={styles.category}>
          <h4 style={styles.categoryTitle}>Round</h4>
          <div style={styles.grid}>
            {roundBricks.map(def => (
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
      )}
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
  const { dimensions, shape } = definition
  const label = `${dimensions.width}x${dimensions.depth}`

  // Render different preview shapes based on brick shape type
  const renderPreview = () => {
    const baseWidth = Math.min(dimensions.width * 10, 36)
    const baseHeight = Math.min(dimensions.depth * 10, 36)

    if (shape === 'slope') {
      // Slope: triangle-ish shape
      return (
        <svg width={baseWidth} height={baseHeight} viewBox="0 0 40 40">
          <polygon
            points="0,40 40,40 40,10 0,40"
            fill={colorHex}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
          />
          <polygon
            points="0,40 40,10 40,0 0,0"
            fill={colorHex}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
            opacity="0.7"
          />
        </svg>
      )
    }

    if (shape === 'round' || shape === 'cylinder') {
      // Round: circle
      return (
        <div
          style={{
            width: baseWidth,
            height: baseWidth,
            backgroundColor: colorHex,
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.2)',
          }}
        />
      )
    }

    if (shape === 'cone') {
      // Cone: triangle
      return (
        <svg width={baseWidth} height={baseHeight} viewBox="0 0 40 40">
          <polygon
            points="20,0 40,40 0,40"
            fill={colorHex}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
          />
        </svg>
      )
    }

    // Default: rectangle
    return (
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          backgroundColor: colorHex,
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.2)',
        }}
      />
    )
  }

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
        {renderPreview()}
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
    maxHeight: 'calc(100vh - 250px)',
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
