interface AlertMessageProps {
    type: "success" | "danger";
    message: string;
}

function AlertMessage({ type, message }: AlertMessageProps) {
    return (
        <div
            className={`alert alert-${type} m-3`}
            role="alert"
        >
            {message}
        </div>
    );
}

export default AlertMessage;