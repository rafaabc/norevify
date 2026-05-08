import styles from './UpdatePrompt.module.css';

export default function UpdatePrompt({ onUpdate }) {
  return (
    <div className={styles.toast}>
      <span>Nova versão disponível</span>
      <button className={styles.btn} onClick={onUpdate}>Recarregar</button>
    </div>
  );
}
