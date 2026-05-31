import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro não tratado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#d32f2f",
          }}
        >
          <h2>⚠️ Algo deu errado</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => location.reload()}>Recarregar página</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
