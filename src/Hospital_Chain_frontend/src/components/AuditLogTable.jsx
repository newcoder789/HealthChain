import { motion } from 'framer-motion';
import { Eye, Download, Share, Shield, Clock } from 'lucide-react';

const AuditLogTable = ({ logs = [] }) => {
  const defaultLogs = [
    {
      id: 1,
      action: 'Record Viewed',
      user: 'Dr. Smith',
      role: 'Doctor',
      timestamp: '2025-01-13 10:30 AM',
      details: 'Accessed blood test results',
      icon: Eye,
      color: 'text-blue-400'
    },
    {
      id: 2,
      action: 'Record Shared',
      user: 'John Doe',
      role: 'Patient',
      timestamp: '2025-01-13 9:15 AM',
      details: 'Shared X-ray with Dr. Smith',
      icon: Share,
      color: 'text-primary-400'
    },
    {
      id: 3,
      action: 'Record Downloaded',
      user: 'Research Team A',
      role: 'Researcher',
      timestamp: '2025-01-13 8:45 AM',
      details: 'Downloaded anonymized dataset',
      icon: Download,
      color: 'text-accent-400'
    },
    {
      id: 4,
      action: 'Access Granted',
      user: 'Jane Doe',
      role: 'Patient',
      timestamp: '2025-01-12 4:20 PM',
      details: 'Granted access to Dr. Johnson',
      icon: Shield,
      color: 'text-neon-400'
    },
  ];

  const auditLogs = logs.length > 0 ? logs : defaultLogs;

  return (
    <div className="glass-card rounded-xl border border-white/20 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary-400" />
          Audit Trail
        </h3>
        <p className="text-gray-400 text-sm mt-1">Complete transparency of all record activities</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, index) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <log.icon className={`h-4 w-4 mr-2 ${log.color}`} />
                    <span className="text-white font-medium">{log.action}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {log.user}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    log.role === 'Patient' ? 'bg-primary-500/20 text-primary-400' :
                    log.role === 'Doctor' ? 'bg-secondary-500/20 text-secondary-400' :
                    'bg-accent-500/20 text-accent-400'
                  }`}>
                    {log.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                  {log.timestamp}
                </td>
                <td className="px-6 py-4 text-gray-300 text-sm">
                  {log.details}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable;