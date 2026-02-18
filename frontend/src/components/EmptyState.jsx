import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

function EmptyState() {
  return (
    <motion.section
      className="panel empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Sparkles size={24} />
      <h3>Nothing here yet</h3>
      <p>Create your first task or relax with a zero-inbox moment.</p>
    </motion.section>
  );
}

export default EmptyState;

