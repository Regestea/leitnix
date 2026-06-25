export default function LearningProgress() {
  return (
    <>
      <div className="card glass progress-card">
        <div className="progress-inner">
          <div className="card-title">Learning Progress</div>
          <div>
            <div className="progress-header">
              <span className="progress-label">Learned</span>
              <span className="progress-number">
                45<small>/100</small>
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-fill" style={{ width: "45%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
