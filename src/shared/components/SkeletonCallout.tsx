interface SkeletonCalloutProps {
    lineas?: number;
}

function SkeletonCallout({ lineas = 2 }: SkeletonCalloutProps) {
    return (
        <div className="callout callout-secondary mb-3 shadow-sm placeholder-glow" aria-hidden="true">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="placeholder col-3 rounded" style={{ height: "1rem" }}></span>
                <span className="placeholder col-2 rounded-pill" style={{ height: "1.4rem" }}></span>
            </div>
            {Array.from({ length: lineas }).map((_, i) => (
                <span
                    key={i}
                    className={`placeholder rounded d-block ${i === lineas - 1 ? "col-4" : "col-6 mb-2"}`}
                    style={{ height: "0.8rem" }}
                ></span>
            ))}
        </div>
    );
}

export default SkeletonCallout;
