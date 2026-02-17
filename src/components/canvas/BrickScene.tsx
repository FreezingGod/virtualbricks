import { useSceneStore } from '@/store'
import { BrickMesh } from './BrickMesh'

export function BrickScene() {
  const bricks = useSceneStore(state => state.bricks)

  return (
    <group name="brick-scene">
      {Array.from(bricks.values()).map(brick => (
        <BrickMesh key={brick.id} brick={brick} />
      ))}
    </group>
  )
}
