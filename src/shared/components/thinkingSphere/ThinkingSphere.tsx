import styles from './ThinkingSphere.module.css';

interface ThinkingSphereProps {
    className?: string;
    style?: React.CSSProperties;
}

function ThinkingSphere({ className, style }: ThinkingSphereProps) {
    return (
        <div
            className={`${styles.sphereLoader}${className ? ` ${className}` : ''}`}
            style={style}
        >
            <div className={`${styles.orb} ${styles.orb1}`}></div>
            <div className={`${styles.orb} ${styles.orb2}`}></div>
            <div className={`${styles.orb} ${styles.orb3}`}></div>
            <div className={styles.glassLayer}></div>
        </div>
    );
}

export default ThinkingSphere;