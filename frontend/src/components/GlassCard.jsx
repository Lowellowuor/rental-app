export default function GlassCard({ children }) {
  return (
    <div className="glass p-4 transition-all hover:shadow-xl">
      {children}
    </div>
  )
}
