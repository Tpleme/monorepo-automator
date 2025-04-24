//join depois do map é para não fazer join com uma virgula

// biome-ignore format: no format
export const checkAppVersionJob = apps => {
	return `
    
  check-version:
    needs: quality
    runs-on: ubuntu-latest
    name: Check apps version
    steps:
      - name: Checkout
        uses: actions/checkout@v4
    ${apps.map(
		app =>
			`
      - name: Check if ${app.name} version has been updated
        id: check-${app.name}
        uses: EndBug/version-check@v2.1.5
        with:
          file-name: ./${app.name}/package.json
          diff-search: true
`
	).join("")} 
    outputs:
    ${apps.map(
		app =>	 `
      ${app.name}-changed: \${{ steps.check-${app.name}.outputs.changed }}
      ${app.name}-commit: \${{ steps.check-${app.name}.outputs.commit }}
      ${app.name}-version: \${{ steps.check-${app.name}.outputs.version }}

      `
	).join("")}
`
};

// biome-ignore format: no format
export const buildJob = (app, buildable) => {
	return `

  build-${app.name}:
    if: \${{ always() && contains(join(needs.quality.result, ','), 'success') && needs.check-version.outputs.${app.name}-changed == 'true' }}
    needs: [quality, check-version]
    runs-on: ubuntu-latest
    name: Build and Deploy ${app.name.charAt(0).toUpperCase() + app.name.slice(1)}
    defaults:
      run:
        working-directory: ./${app.name}
    steps:
    - name: git-checkout
      uses: actions/checkout@v4

    - name: building
      run: |
        echo "Version change found in commit \${{ needs.check-version.outputs.${app.name}-commit }}! New version: \${{ needs.check-version.outputs.${app.name}-version }}"
        echo "Starting to build and publish ${app.name} app"
    ${buildable ?
		`
    - name: 'Create env file'
      run: |
        mkdir envDir
        echo "\${{ secrets.${app.name.toUpperCase()}_ENV_FILE }}" > envDir/.env

    - name: Install all dependencies
      run: npm install
        
    - name: Build
      run: npm run build`:""
	}
  
    - name: Deploy
      uses: burnett01/rsync-deployments@7.0.2
      with:
        switches: -avz --delete --exclude-from='./${app.name}/rsync-ignore.txt'
        path:  ${buildable ? `./${app.name}/dist/` : `./${app.name}/`}
        remote_path: \${{ secrets.DEPLOY_${app.name.toUpperCase()}_PATH }}
        remote_host: \${{ secrets.DEPLOY_HOST }}
        remote_port: \${{ secrets.DEPLOY_PORT }}
        remote_user: \${{ secrets.DEPLOY_USER }}
        remote_key: \${{ secrets.DEPLOY_KEY }}
          `
};
