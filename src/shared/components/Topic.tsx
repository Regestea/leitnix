import styles from "./Topic.module.css";

export default function Topic({ text }: { text: string }) {
  return <h3 className={styles.topic}>{text}</h3>;
}
