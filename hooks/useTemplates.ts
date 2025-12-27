import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { FixedCostTemplate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const useTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FixedCostTemplate[]>([]);
  const [archivedTemplates, setArchivedTemplates] = useState<FixedCostTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setArchivedTemplates([]);
      setLoading(false);
      return;
    }

    const templatesRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates');

    // Active templates
    const activeQuery = query(templatesRef, where('isArchived', '==', false));
    const unsubscribeActive = onSnapshot(activeQuery, (snapshot) => {
      const templatesData: FixedCostTemplate[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as FixedCostTemplate[];
      const sortedTemplates = templatesData.sort((a, b) => a.order - b.order);
      setTemplates(sortedTemplates);
    });

    // Archived templates
    const archivedQuery = query(templatesRef, where('isArchived', '==', true));
    const unsubscribeArchived = onSnapshot(archivedQuery, (snapshot) => {
      const archivedData: FixedCostTemplate[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as FixedCostTemplate[];
      const sortedArchived = archivedData.sort((a, b) => a.order - b.order);
      setArchivedTemplates(sortedArchived);
      setLoading(false);
    });

    return () => {
      unsubscribeActive();
      unsubscribeArchived();
    };
  }, [user]);

  const addTemplate = async (templateData: Omit<FixedCostTemplate, 'id' | 'order' | 'isArchived' | 'updatedAt'>) => {
    if (!user) return;

    const templatesRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates');

    // Get next order
    const nextOrder = templates.length;

    await addDoc(templatesRef, {
      ...templateData,
      order: nextOrder,
      isArchived: false,
      updatedAt: new Date(),
    });
    toast.success('テンプレートを追加しました');
  };

  const updateTemplate = async (templateId: string, templateData: Partial<Omit<FixedCostTemplate, 'id' | 'order' | 'isArchived'>>) => {
    if (!user) return;

    const templateRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates', templateId);
    await updateDoc(templateRef, {
      ...templateData,
      updatedAt: new Date(),
    });
    toast.success('テンプレートを更新しました');
  };

  const archiveTemplate = async (templateId: string) => {
    if (!user) return;

    const templateRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates', templateId);
    await updateDoc(templateRef, {
      isArchived: true,
      updatedAt: new Date(),
    });
    toast.success('テンプレートをアーカイブしました');
  };

  const restoreTemplate = async (templateId: string) => {
    if (!user) return;

    const templateRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates', templateId);
    await updateDoc(templateRef, {
      isArchived: false,
      updatedAt: new Date(),
    });
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) return;

    const templateRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates', templateId);
    await deleteDoc(templateRef);
    toast.success('テンプレートを削除しました');
  };

  const reorderTemplates = async (newOrder: FixedCostTemplate[]) => {
    if (!user) return;

    const batch = writeBatch(db);
    newOrder.forEach((template, index) => {
      const templateRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates', template.id);
      batch.update(templateRef, {
        order: index,
        updatedAt: new Date(),
      });
    });

    await batch.commit();
  };

  return {
    templates,
    archivedTemplates,
    loading,
    addTemplate,
    updateTemplate,
    archiveTemplate,
    restoreTemplate,
    deleteTemplate,
    reorderTemplates
  };
};