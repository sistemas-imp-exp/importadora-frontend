interface SkeletonCardsProps {
    cantidad?: number;
    columnas?: string;
}

function SkeletonCards({ cantidad = 3, columnas = "col-xl-3 col-lg-4 col-md-6 col-sm-12" }: SkeletonCardsProps) {
    return (
        <div className="row g-2 mb-3" aria-hidden="true">
            {Array.from({ length: cantidad }).map((_, i) => (
                <div className={columnas} key={i}>
                    <div className="card h-100 placeholder-glow">
                        <div className="card-body">
                            <span className="placeholder col-5 rounded d-block mb-2" style={{ height: "0.75rem" }}></span>
                            <span className="placeholder col-8 rounded d-block" style={{ height: "1.5rem" }}></span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default SkeletonCards;
