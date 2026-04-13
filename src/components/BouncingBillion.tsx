import Mascot from './Mascot';

/**
 * DVD-screensaver-style bouncing mascot.
 * Two nested elements animate on X and Y axes independently with
 * different durations so the mascot follows a pseudo-random path.
 */
export default function BouncingBillion() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9000,
        overflow: 'hidden',
      }}
    >
      {/* Outer div bounces horizontally */}
      <div className="bounce-x" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {/* Inner div bounces vertically */}
        <div className="bounce-y" style={{ position: 'absolute', top: 0, left: 0 }}>
          <Mascot size={72} animate={true} />
        </div>
      </div>
    </div>
  );
}
