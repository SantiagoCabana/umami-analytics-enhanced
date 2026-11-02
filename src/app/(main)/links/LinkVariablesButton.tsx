import {
  Button,
  Column,
  Form,
  FormField,
  FormSubmitButton,
  Heading,
  Icon,
  ListItem,
  Row,
  Select,
  Text,
  TextField,
} from '@umami/react-zen';
import { useState } from 'react';
import { LinkButton } from '@/components/common/LinkButton';
import {
  useApi,
  useLinkVariablesQuery,
  useLoginQuery,
  useMessages,
  useModified,
  useNavigation,
  useTimezone,
} from '@/components/hooks';
import { Edit, Plus, Trash, Variable } from '@/components/icons';
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
  const { touch } = useModified();
  const { data, isLoading, error } = useLinkVariablesQuery();
  const [editing, setEditing] = useState<LinkVariable | null>(null);
  const [addedVariables, setAddedVariables] = useState<LinkVariable[]>([]);
  const [updatedVariables, setUpdatedVariables] = useState<Record<string, LinkVariable>>({});
  const [removedVariableIds, setRemovedVariableIds] = useState<string[]>([]);
  const [sort, setSort] = useState<VariableSort>('name-asc');

  const saveMutation = useMutation({
    mutationFn: ({ variableId, ...values }: LinkVariableInput) =>
      post(variableId ? `/admin/link-variables/${variableId}` : '/admin/link-variables', values),
    onSuccess: (variable: LinkVariable) => {
      setUpdatedVariables(variables => ({ ...variables, [variable.id]: variable }));
      setAddedVariables(variables =>
        variables.some(item => item.id === variable.id) ? variables : [...variables, variable],
      );
      touch('link-variables');
      setEditing(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (variableId: string) => del(`/admin/link-variables/${variableId}`),
    onSuccess: (_: unknown, variableId: string) => {
      setRemovedVariableIds(ids => [...ids, variableId]);
      touch('link-variables');
    },
  });

  const fetchedVariables = (data || []) as LinkVariable[];
  const variables = sortLinkVariables(
    [
      ...fetchedVariables,
      ...addedVariables.filter(variable => !fetchedVariables.some(item => item.id === variable.id)),
    ]
      .filter(variable => !removedVariableIds.includes(variable.id))
      .map(variable => updatedVariables[variable.id] || variable),
    sort,
  );

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

  return (
    <Column gap="6">
      <Column gap="1">
        <Text color="muted">{t(messages.linkVariableHelp)}</Text>
        <Text color="muted" size="sm">
          {t(messages.linkVariableExample)}
        </Text>
      </Column>

      <Column gap="3">
        <Heading size="base">{editing ? t(labels.edit) : t(labels.add)}</Heading>
        <Form
          key={editing?.id || 'new'}
          defaultValues={{ name: editing?.name || '', value: editing?.value || '' }}
          error={getErrorMessage(saveMutation.error)}
          mode="onChange"
          onSubmit={(values: LinkVariableInput) =>
            saveMutation.mutateAsync({ variableId: editing?.id, ...values })
          }
        >
          <Row gap="3" alignItems="flex-end">
            <FormField
              label={t(labels.name)}
              name="name"
              rules={{ required: t(labels.required), validate: checkName }}
              style={{ flex: 1 }}
            >
              <TextField
                placeholder="whatsapp_token"
                autoComplete="off"
                isReadOnly={!!editing && !user.isAdmin}
              />
            </FormField>
            <FormField
              label={t(labels.value)}
              name="value"
              rules={{ required: t(labels.required) }}
              style={{ flex: 2 }}
            >
              <TextField autoComplete="off" />
            </FormField>
            <Row gap="2" paddingBottom="1">
              {editing && (
                <Button variant="quiet" onPress={() => setEditing(null)}>
                  {t(labels.cancel)}
                </Button>
              )}
              <FormSubmitButton isLoading={saveMutation.isPending} requireValid>
                <Icon>{editing ? <Edit /> : <Plus />}</Icon>
                {editing ? t(labels.save) : t(labels.add)}
              </FormSubmitButton>
            </Row>
          </Row>
        </Form>
      </Column>

      <Column gap="3">
        <Row alignItems="center" justifyContent="space-between">
          <Heading size="base">{t(labels.variables)}</Heading>
          {!isLoading && !error && <Text color="muted">{variables.length}</Text>}
        </Row>
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
        {isLoading ? (
          <p className="text-sm text-muted">{t(labels.loading)}</p>
        ) : error ? (
          <p className="text-sm text-error">{getErrorMessage(error)}</p>
        ) : variables.length === 0 ? (
          <p className="text-sm text-muted">{t(labels.none)}</p>
        ) : (
          <Column gap="2" overflowY="auto" maxHeight="min(360px, 35dvh)">
            {variables.map(variable => (
              <Row
                key={variable.id}
                alignItems="center"
                gap="3"
                paddingY="2"
                paddingX="3"
                border
                borderRadius
                backgroundColor="surface-raised"
              >
                <Column gap="0" style={{ flex: 1, minWidth: 0 }}>
                  <Text weight="medium">{variable.name}</Text>
                  <Text color="muted" size="sm" truncate>
                    {variable.value}
                  </Text>
                  <Text color="muted" size="sm">
                    {t(labels.created)}: {formatDate(variable.createdAt)}
                  </Text>
                  <Text color="muted" size="sm">
                    {t(labels.updated)}: {formatDate(variable.updatedAt)}
                  </Text>
                </Column>
                <Button
                  variant="quiet"
                  aria-label={t(labels.edit)}
                  isDisabled={saveMutation.isPending || deleteMutation.isPending}
                  onPress={() => setEditing(variable)}
                >
                  <Icon>
                    <Edit />
                  </Icon>
                </Button>
                <Button
                  variant="quiet"
                  aria-label={t(labels.delete)}
                  isDisabled={deleteMutation.isPending || saveMutation.isPending}
                  onPress={() => deleteMutation.mutateAsync(variable.id)}
                >
                  <Icon>
                    <Trash />
                  </Icon>
                </Button>
              </Row>
            ))}
          </Column>
        )}
      </Column>

      {onClose && (
        <Row justifyContent="flex-end" paddingTop="2">
          <Button variant="quiet" onPress={onClose}>
            {t(labels.close)}
          </Button>
        </Row>
      )}
    </Column>
  );
}
