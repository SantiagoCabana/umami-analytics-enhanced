import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Column,
  Form,
  FormField,
  FormSubmitButton,
  Icon,
  ListItem,
  Row,
  Select,
  Text,
  TextField,
} from '@umami/react-zen';
import { useState } from 'react';
import { ConfirmationForm } from '@/components/common/ConfirmationForm';
import { LinkButton } from '@/components/common/LinkButton';
import {
  useApi,
  useLinkVariablesQuery,
  useLoginQuery,
  useMessages,
  useNavigation,
  useTimezone,
} from '@/components/hooks';
import { Edit, Plus, Trash, Variable } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { sortLinkVariables, type VariableSort } from '@/lib/link-variable-sort';
import { canAccessLinkVariables, normalizeLinkVariableName } from '@/lib/link-variables';

type LinkVariable = {
  id: string;
  name: string;
  value: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type LinkVariableInput = {
  variableId?: string;
  name: string;
  value: string;
};

export function LinkVariablesButton() {
  const { t, labels } = useMessages();
  const { user } = useLoginQuery();
  const { renderUrl } = useNavigation();

  if (!canAccessLinkVariables(user)) {
    return null;
  }

  return (
    <LinkButton href={renderUrl('/links/variables', false)} variant="outline">
      <Icon>
        <Variable />
      </Icon>
      {t(labels.variables)}
    </LinkButton>
  );
}

export function LinkVariablesManager({ onClose }: { onClose?: () => void }) {
  const { t, labels, messages, getErrorMessage } = useMessages();
  const { user } = useLoginQuery();
  const { formatTimezoneDate } = useTimezone();
  const { post, del, useMutation } = useApi();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useLinkVariablesQuery();
  const [editing, setEditing] = useState<LinkVariable | 'new' | null>(null);
  const [deleting, setDeleting] = useState<LinkVariable | null>(null);
  const [sort, setSort] = useState<VariableSort>('name-asc');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['link-variables'] });
  const saveMutation = useMutation({
    mutationFn: ({ variableId, ...values }: LinkVariableInput) =>
      post(variableId ? `/admin/link-variables/${variableId}` : '/admin/link-variables', values),
    onSuccess: async (saved: LinkVariable) => {
      await queryClient.cancelQueries({ queryKey: ['link-variables'] });
      queryClient.setQueriesData<LinkVariable[]>({ queryKey: ['link-variables'] }, previous =>
        previous ? [...previous.filter(item => item.id !== saved.id), saved] : previous,
      );
      setEditing(null);
      await refresh();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (variableId: string) => del(`/admin/link-variables/${variableId}`),
    onSuccess: async (_: unknown, variableId: string) => {
      await queryClient.cancelQueries({ queryKey: ['link-variables'] });
      queryClient.setQueriesData<LinkVariable[]>({ queryKey: ['link-variables'] }, previous =>
        previous?.filter(item => item.id !== variableId),
      );
      setDeleting(null);
      await refresh();
    },
  });

  const variables = sortLinkVariables((data || []) as LinkVariable[], sort);
  const formatDate = (value: string | null) =>
    value && Number.isFinite(Date.parse(value))
      ? formatTimezoneDate(value, 'dd-MM-yyyy HH:mm')
      : '—';
  const sortOptions: { id: VariableSort; label: string }[] = [
    { id: 'name-asc', label: labels.variableSortNameAsc },
    { id: 'name-desc', label: labels.variableSortNameDesc },
    { id: 'created-desc', label: labels.variableSortCreatedDesc },
    { id: 'created-asc', label: labels.variableSortCreatedAsc },
    { id: 'updated-desc', label: labels.variableSortUpdatedDesc },
    { id: 'updated-asc', label: labels.variableSortUpdatedAsc },
  ];
  const checkName = (name: string) =>
    !!normalizeLinkVariableName(name) || t(messages.invalidLinkVariableName);
  const variable = editing && editing !== 'new' ? editing : null;
  const openEditor = (item: LinkVariable | 'new') => {
    saveMutation.reset();
    setEditing(item);
  };

  return (
    <Column gap="4">
      <Row alignItems="center" justifyContent="space-between" gap="3" wrap="wrap">
        <Select
          value={sort}
          onChange={value => {
            if (value) setSort(value as VariableSort);
          }}
          triggerProps={{ 'aria-label': t(labels.variableSort) }}
        >
          {sortOptions.map(option => (
            <ListItem key={option.id} id={option.id}>
              {t(option.label)}
            </ListItem>
          ))}
        </Select>
        <Row gap="2" alignItems="center">
          <DialogButton
            label={t(labels.variableExample)}
            title={t(labels.variableExample)}
            variant="quiet"
            width="520px"
          >
            {({ close }) => (
              <Column gap="3">
                <Text>{t(messages.variableExampleIntro)}</Text>
                <pre className="whitespace-pre-wrap break-all rounded bg-muted p-3">
                  {'enlace = https://example.com/contacto\n' + '$' + '{enlace}?origen=campana'}
                </pre>
                <Text color="muted" size="sm">
                  {t(messages.variableExampleResult)}
                </Text>
                <Row justifyContent="flex-end">
                  <Button onPress={close}>{t(labels.close)}</Button>
                </Row>
              </Column>
            )}
          </DialogButton>
          <Button variant="primary" onPress={() => openEditor('new')}>
            <Icon>
              <Plus />
            </Icon>
            {t(labels.add)}
          </Button>
        </Row>
      </Row>
      {isLoading ? (
        <p className="text-sm text-muted">{t(labels.loading)}</p>
      ) : error ? (
        <p className="text-sm text-error">{getErrorMessage(error)}</p>
      ) : variables.length === 0 ? (
        <p className="text-sm text-muted">{t(labels.none)}</p>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="w-full text-sm" style={{ minWidth: 720, tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b text-left">
                <th className="p-3" style={{ width: '20%' }} scope="col">
                  {t(labels.name)}
                </th>
                <th className="p-3" style={{ width: '34%' }} scope="col">
                  {t(labels.value)}
                </th>
                <th className="p-3" style={{ width: '17%' }} scope="col">
                  {t(labels.created)}
                </th>
                <th className="p-3" style={{ width: '17%' }} scope="col">
                  {t(labels.updated)}
                </th>
                <th className="p-3" style={{ width: '12%' }} scope="col">
                  <span className="sr-only">{t(labels.actions)}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {variables.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">
                    <span className="block truncate">{item.name}</span>
                  </td>
                  <td className="p-3">
                    <span className="block truncate">{item.value}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                  <td className="p-3 whitespace-nowrap">{formatDate(item.updatedAt)}</td>
                  <td className="p-3">
                    <Row gap="2">
                      <Button
                        variant="quiet"
                        aria-label={`${t(labels.edit)} ${item.name}`}
                        isDisabled={saveMutation.isPending || deleteMutation.isPending}
                        onPress={() => openEditor(item)}
                      >
                        <Icon>
                          <Edit />
                        </Icon>
                      </Button>
                      <Button
                        variant="quiet"
                        aria-label={`${t(labels.delete)} ${item.name}`}
                        isDisabled={saveMutation.isPending || deleteMutation.isPending}
                        onPress={() => {
                          deleteMutation.reset();
                          setDeleting(item);
                        }}
                      >
                        <Icon>
                          <Trash />
                        </Icon>
                      </Button>
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <DialogButton
        isOpen={editing !== null}
        onOpenChange={open => {
          if (!open && !saveMutation.isPending) setEditing(null);
        }}
        title={variable ? t(labels.edit) : t(labels.add)}
        width="600px"
      >
        {() => (
          <Form
            key={variable?.id || 'new'}
            defaultValues={{ name: variable?.name || '', value: variable?.value || '' }}
            error={getErrorMessage(saveMutation.error)}
            mode="onChange"
            onSubmit={(values: LinkVariableInput) =>
              saveMutation.mutateAsync({ variableId: variable?.id, ...values })
            }
          >
            <Column gap="3">
              <FormField
                label={t(labels.name)}
                name="name"
                rules={{ required: t(labels.required), validate: checkName }}
              >
                <TextField
                  placeholder="enlace"
                  autoComplete="off"
                  isReadOnly={!!variable && !user.isAdmin}
                />
              </FormField>
              <FormField
                label={t(labels.value)}
                name="value"
                rules={{ required: t(labels.required) }}
              >
                <TextField autoComplete="off" />
              </FormField>
              <Row gap="2" justifyContent="flex-end">
                <Button isDisabled={saveMutation.isPending} onPress={() => setEditing(null)}>
                  {t(labels.cancel)}
                </Button>
                <FormSubmitButton isLoading={saveMutation.isPending} requireValid>
                  {variable ? t(labels.save) : t(labels.add)}
                </FormSubmitButton>
              </Row>
            </Column>
          </Form>
        )}
      </DialogButton>
      <DialogButton
        isOpen={!!deleting}
        onOpenChange={open => {
          if (!open && !deleteMutation.isPending) setDeleting(null);
        }}
        title={t(labels.delete)}
        width="440px"
      >
        {() => (
          <ConfirmationForm
            message={
              <Column gap="2">
                <Text>{t(messages.variableDeleteConfirm, { name: deleting?.name || '' })}</Text>
                <Text color="muted" size="sm">
                  {t(messages.variableDeleteWarning)}
                </Text>
              </Column>
            }
            buttonLabel={t(labels.delete)}
            buttonVariant="danger"
            isLoading={deleteMutation.isPending}
            error={getErrorMessage(deleteMutation.error)}
            onConfirm={() => deleting && deleteMutation.mutateAsync(deleting.id)}
            onClose={() => setDeleting(null)}
          />
        )}
      </DialogButton>
      {onClose && (
        <Row justifyContent="flex-end">
          <Button variant="quiet" onPress={onClose}>
            {t(labels.close)}
          </Button>
        </Row>
      )}
    </Column>
  );
}
