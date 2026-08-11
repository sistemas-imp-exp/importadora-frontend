interface CardCollapseButtonProps {
    collapsed: boolean;
    onToggle: () => void;
}

function CardCollapseButton({ collapsed, onToggle }: CardCollapseButtonProps) {
    return (
        <button
            type="button"
            className="btn btn-tool"
            onClick={onToggle}
            title={collapsed ? "Expandir" : "Colapsar"}
        >
            <i className={`bi ${collapsed ? "bi-plus-lg" : "bi-dash-lg"}`} aria-hidden="true"></i>
        </button>
    );
}

export default CardCollapseButton;
