export default function ConfirmBoard({
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="hokm-modal-backdrop">
      <div className="confirm-board">
        <div className="board-lights">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="board-star-row">
          <span>✦</span>
          <span className="board-title">{title}</span>
          <span>✦</span>
        </div>

        <p className="confirm-board-message">{message}</p>

        <div className="confirm-board-actions">
          <button className="board-btn board-btn-join" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="board-btn board-btn-create" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}