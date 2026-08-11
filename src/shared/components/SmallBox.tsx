type SmallBoxColor = "primary" | "success" | "warning" | "danger" | "info" | "secondary";

interface SmallBoxProps {
    titulo: string;
    valor: string | number;
    icono: string;
    color: SmallBoxColor;
}

function SmallBox({ titulo, valor, icono, color }: SmallBoxProps) {
    return (
        <div className={`small-box text-bg-${color} shadow-sm`}>
            <div className="inner">
                <h3>{valor}</h3>
                <p>{titulo}</p>
            </div>
            <i className={`small-box-icon ${icono}`} aria-hidden="true"></i>
        </div>
    );
}

export default SmallBox;
