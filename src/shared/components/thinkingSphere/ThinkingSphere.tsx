import styles from './ThinkingSphere.module.css';

interface ThinkingSphereProps {
    className?: string;
    style?: React.CSSProperties;
    size?: number;
}

function ThinkingSphere({ className, style, size = 180 }: ThinkingSphereProps) {
    const s = (value: number) => `${(size / 180) * value}px`;

    return (
        <div
            className={`${styles.sphereLoader}${className ? ` ${className}` : ''}`}
            style={{
                ...style,
                width: size,
                height: size,
                '--sphere-glass-blur': s(28),
                '--sphere-glow-size': s(40),
                '--sphere-orb-blur': s(18),
                '--sphere-shadow-y': s(10),
                '--sphere-shadow-blur': s(40),
            } as React.CSSProperties}
        >
            <div
                className={`${styles.orb} ${styles.orb1}`}
                style={{
                    width: s(100),
                    height: s(100),
                    top: s(15),
                    left: s(15),
                    '--orb1-x1': s(25),
                    '--orb1-y1': s(25),
                    '--orb1-x2': s(-15),
                    '--orb1-y2': s(35),
                } as React.CSSProperties}
            />
            <div
                className={`${styles.orb} ${styles.orb2}`}
                style={{
                    width: s(110),
                    height: s(110),
                    bottom: s(15),
                    right: s(15),
                    '--orb2-x1': s(-25),
                    '--orb2-y1': s(-20),
                    '--orb2-x2': s(15),
                    '--orb2-y2': s(-35),
                } as React.CSSProperties}
            />
            <div
                className={`${styles.orb} ${styles.orb3}`}
                style={{
                    width: s(90),
                    height: s(90),
                    top: s(40),
                    right: s(20),
                    '--orb3-x1': s(-25),
                    '--orb3-y1': s(20),
                    '--orb3-x2': s(20),
                    '--orb3-y2': s(-15),
                } as React.CSSProperties}
            />
            <div className={styles.glassLayer} />
        </div>
    );
}

export default ThinkingSphere;
