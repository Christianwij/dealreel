import { render, screen, fireEvent } from '@testing-library/react';
import { SearchAndFilter, type SortOption, type FilterOption } from '../SearchAndFilter';

describe('SearchAndFilter', () => {
  const mockOnSearch = jest.fn();
  const mockOnFilter = jest.fn();
  const mockOnSort = jest.fn();

  const defaultProps = {
    onSearch: mockOnSearch,
    onFilter: mockOnFilter as (option: FilterOption) => void,
    onSort: mockOnSort as (option: SortOption) => void,
    sortBy: 'date' as SortOption,
    filterBy: 'all' as FilterOption
  };

  beforeEach(() => {
    mockOnSearch.mockClear();
    mockOnFilter.mockClear();
    mockOnSort.mockClear();
  });

  it('renders search input and filter options', () => {
    render(<SearchAndFilter {...defaultProps} />);

    expect(screen.getByPlaceholderText(/search briefings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort by/i })).toBeInTheDocument();
  });

  it('calls onSearch when search input changes', () => {
    render(<SearchAndFilter {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search briefings/i);
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(mockOnSearch).toHaveBeenCalledWith('test search');
  });

  it('calls onFilter when filter option changes', () => {
    render(<SearchAndFilter {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    const completedOption = screen.getByRole('menuitemcheckbox', { name: /completed/i });
    fireEvent.click(completedOption);
    expect(mockOnFilter).toHaveBeenCalledWith('completed');
  });

  it('calls onSort when sort option changes', () => {
    render(<SearchAndFilter {...defaultProps} />);

    const sortButton = screen.getByRole('button', { name: /sort by/i });
    fireEvent.click(sortButton);
    
    const titleOption = screen.getByRole('menuitemcheckbox', { name: /title/i });
    fireEvent.click(titleOption);
    expect(mockOnSort).toHaveBeenCalledWith('title');
  });

  it('clears search input when X button is clicked', () => {
    render(<SearchAndFilter {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search briefings/i);
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    const clearButton = screen.getByRole('button', { name: /x/i });
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
}); 