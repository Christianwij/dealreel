import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload';

// Mock the useSupabaseClient hook
jest.mock('@supabase/auth-helpers-react', () => ({
  useSupabaseClient: () => ({
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.pdf' }, error: null }),
      }),
    },
  }),
}));

describe('FileUpload', () => {
  const mockOnUploadComplete = jest.fn();

  beforeEach(() => {
    mockOnUploadComplete.mockClear();
  });

  it('renders the upload area', () => {
    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to select/i)).toBeInTheDocument();
  });

  it('validates file types', async () => {
    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const dropzone = screen.getByTestId('dropzone');
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(await screen.findByText(/file type not supported/i)).toBeInTheDocument();
    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });

  it('handles valid file upload', async () => {
    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByTestId('dropzone');
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(await screen.findByText(/uploading/i)).toBeInTheDocument();
    expect(mockOnUploadComplete).toHaveBeenCalledWith('test.pdf');
  });

  it('handles file selection via click', async () => {
    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    
    userEvent.upload(input, file);
    
    expect(await screen.findByText(/uploading/i)).toBeInTheDocument();
    expect(mockOnUploadComplete).toHaveBeenCalledWith('test.pdf');
  });

  it('displays error message on upload failure', async () => {
    // Mock upload failure
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.mock('@supabase/auth-helpers-react', () => ({
      useSupabaseClient: () => ({
        storage: {
          from: () => ({
            upload: jest.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') }),
          }),
        },
      }),
    }));

    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByTestId('dropzone');
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(await screen.findByText(/error uploading file/i)).toBeInTheDocument();
    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });
}); 