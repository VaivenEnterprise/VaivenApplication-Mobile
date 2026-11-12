import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useItem } from '@/features/items/hooks';
import { ItemFormScreen } from '@/features/items/screens/ItemFormScreen';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';

/** Carga el objeto y abre el formulario en modo edición (spec 005 T009, CA-06). */
export function EditItemScreen({ id }: { id: string }) {
  const router = useRouter();
  const query = useItem(id);

  if (query.data !== undefined) return <ItemFormScreen item={query.data} />;

  const notFound =
    query.isError && query.error instanceof ApiError && query.error.code === 'not_found';
  return (
    <Screen>
      {query.isPending ? (
        <View testID="edit-item-skeleton">
          <Skeleton shape="card" />
        </View>
      ) : notFound ? (
        <EmptyState
          icon="cube"
          title={es.items.detail.notFoundTitle}
          description={es.items.detail.notFoundDescription}
          actionLabel={es.items.detail.notFoundAction}
          onAction={() => router.back()}
        />
      ) : (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}
    </Screen>
  );
}
