import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import DataTable from '@/components/common/data-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Season } from '@/models/season';
import { 
  useSeasonsQuery, 
  useCreateSeasonMutation, 
  useUpdateSeasonMutation, 
  useDeleteSeasonMutation 
} from '@/queries/season';
import { seasonSchema, SeasonFormData, defaultSeasonValues } from './form-config';

interface ExtendedSeason extends Season {
  key: string;
}

const Seasons = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
    defaultValues: defaultSeasonValues,
  });

  // Use hooks from queries
  const { data: seasonsData, isLoading } = useSeasonsQuery({ 
    page: currentPage, 
    limit: pageSize 
  });
  
  const createMutation = useCreateSeasonMutation();
  const updateMutation = useUpdateSeasonMutation();
  const deleteMutation = useDeleteSeasonMutation();

  const handleAddSeason = () => {
    setEditingSeason(null);
    reset(defaultSeasonValues);
    setOpenDialog(true);
  };

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    reset({
      name: season.name,
      code: season.code,
      year: season.year,
      start_date: season.start_date ? new Date(season.start_date).toISOString().split('T')[0] : '',
      end_date: season.end_date ? new Date(season.end_date).toISOString().split('T')[0] : '',
      description: season.description || '',
      is_active: season.is_active,
    });
    setOpenDialog(true);
  };

  const handleDeleteSeason = (season: Season) => {
    setDeletingSeason(season);
    setOpenDeleteDialog(true);
  };

  const onSubmit = (data: SeasonFormData) => {
    if (editingSeason) {
      updateMutation.mutate({ id: editingSeason.id, season: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingSeason) {
      deleteMutation.mutate(deletingSeason.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSeason(null);
    reset(defaultSeasonValues);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingSeason(null);
  };


  const getSeasonList = (): ExtendedSeason[] => {
    if (!seasonsData?.data?.items) return [];
    
    return seasonsData.data.items.map((season: Season) => ({
      ...season,
      key: season.id.toString(),
    }));
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (value: unknown) => (
        <Typography variant="body2" fontWeight="bold">
          {String(value)}
        </Typography>
      ),
    },
    {
      title: 'Tên mùa vụ',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Năm',
      dataIndex: 'year',
      key: 'year',
      width: 100,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (value: unknown) => (
        <Typography variant="body2">
          {value ? new Date(String(value)).toLocaleDateString('vi-VN') : '-'}
        </Typography>
      ),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (value: unknown) => (
        <Typography variant="body2">
          {value ? new Date(String(value)).toLocaleDateString('vi-VN') : '-'}
        </Typography>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (value: unknown) => (
        <Chip
          label={value ? 'Đang hoạt động' : 'Đã kết thúc'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: ExtendedSeason) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => handleEditSeason(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteSeason(record)}
          >
            Xóa
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Mùa vụ
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddSeason}
        >
          Thêm mùa vụ
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={getSeasonList() as any}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: seasonsData?.data?.total || 0,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mùa vụ`,
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSeason ? 'Chỉnh sửa mùa vụ' : 'Thêm mùa vụ mới'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Tên mùa vụ"
                fullWidth
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                placeholder="VD: Đông Xuân 2024"
              />
              
              <TextField
                label="Mã mùa vụ"
                fullWidth
                {...register('code')}
                error={!!errors.code}
                helperText={errors.code?.message}
                placeholder="VD: DX2024"
              />
              
              <TextField
                label="Năm"
                type="number"
                fullWidth
                {...register('year', { valueAsNumber: true })}
                error={!!errors.year}
                helperText={errors.year?.message}
              />
              
              <TextField
                label="Ngày bắt đầu"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('start_date')}
                error={!!errors.start_date}
                helperText={errors.start_date?.message}
              />
              
              <TextField
                label="Ngày kết thúc"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('end_date')}
                error={!!errors.end_date}
                helperText={errors.end_date?.message}
              />
              
              <TextField
                label="Mô tả"
                fullWidth
                multiline
                rows={3}
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={watch('is_active')}
                    onChange={(e) => setValue('is_active', e.target.checked)}
                  />
                }
                label="Đang hoạt động"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <CircularProgress size={24} />
              ) : editingSeason ? (
                'Cập nhật'
              ) : (
                'Tạo mới'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa mùa vụ <strong>{deletingSeason?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={24} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Seasons;
