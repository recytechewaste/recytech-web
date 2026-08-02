import styles from '../styles/ToggleSwitch.module.css';

const ToggleSwitch = ({ checked, onChange, label, disabled = false }) => {
    return (
        <label className={`${styles.switchContainer} ${disabled ? styles.disabled : ''}`}>
            <div className={`${styles.switch} ${checked ? styles.checked : ''}`}>
                <input 
                    type="checkbox" 
                    className={styles.input} 
                    checked={checked} 
                    onChange={onChange} 
                    disabled={disabled}
                    aria-checked={checked}
                />
                <span className={styles.slider}></span>
            </div>
            {label && <span className={styles.label}>{label}</span>}
        </label>
    );
};

export default ToggleSwitch;
