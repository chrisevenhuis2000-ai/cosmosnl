'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">&#x2604;</div>
            <h1 className="text-2xl font-bold text-star mb-3 font-serif">
              Er ging iets mis
            </h1>
            <p className="text-star/60 mb-8">
              Er is een onverwachte fout opgetreden. Probeer het opnieuw of kom later terug.
            </p>
            <button
              onClick={this.reset}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
