import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wallet, PieChart, ListTodo, BarChart3, FileText, Package } from 'lucide-react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

const iconMap: Record<string, typeof Wallet> = { wallet: Wallet, budget: PieChart, chart: BarChart3, list: ListTodo, file: FileText, default: Package };

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = iconMap[icon] ?? iconMap.default;
  return (
    <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <div className="empty-state__icon">
        <Icon size={22} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </motion.div>
  );
}
