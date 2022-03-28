import queryString from "query-string";
import {NextRouter} from "next/router";

export const setQuery = (values: any, router: NextRouter, replace: boolean = false) => {
    Object.keys(values).forEach((key) => {
        if (values[key] instanceof Date) {
            values[key] = values[key].toISOString();
        }
    });
    router[replace?"replace":"push"]({
        pathname: router.pathname,
        search: queryString.stringify(
            values,
            {
                skipEmptyString: true,
                skipNull: true,
                arrayFormat: 'bracket-separator',
                arrayFormatSeparator: ','
            }
        )
    });
}

export const parseQuery = (router: NextRouter) =>  {
    return queryString.parse(router.asPath.split("?")[1], {
        arrayFormat: 'bracket-separator',
        arrayFormatSeparator: ','
    });
}

export const parseParams = (params:any) => {
  params = {...params} // Create a copy to avoid to set object reference
  if (params && params.sort_by && params.sort_dir) {
    params.sort = `${params.sort_by} ${params.sort_dir}`.trim()
    delete params.sort_by;
    delete params.sort_dir;
  }

  Object.keys(params).forEach((key) => {
    if (params[key] instanceof Date) {
      params[key] = params[key].toISOString();
    }
  })

  return '?' + queryString.stringify(
    params,
    {
      skipEmptyString: true,
      skipNull: true,
      arrayFormat: 'bracket-separator',
      arrayFormatSeparator: ','
    }
  );
};
