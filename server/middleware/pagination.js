/**
 * Pagination middleware – parses ?page=1&limit=10 from query string
 * and attaches { page, limit, offset } to req.pagination.
 */
const pagination = (defaultLimit = 10, maxLimit = 100) => {
  return (req, _res, next) => {
    let page  = parseInt(req.query.page,  10) || 1;
    let limit = parseInt(req.query.limit, 10) || defaultLimit;

    if (page  < 1) page  = 1;
    if (limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    req.pagination = {
      page,
      limit,
      offset: (page - 1) * limit,
    };
    next();
  };
};

/**
 * Build pagination metadata for response.
 */
const buildPaginationMeta = (totalCount, page, limit) => ({
  total:       totalCount,
  page,
  limit,
  totalPages:  Math.ceil(totalCount / limit),
  hasNextPage: page < Math.ceil(totalCount / limit),
  hasPrevPage: page > 1,
});

module.exports = { pagination, buildPaginationMeta };
