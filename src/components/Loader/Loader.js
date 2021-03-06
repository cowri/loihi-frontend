import LinearProgress from '@material-ui/core/LinearProgress'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  colorPrimary: {
    backgroundColor: theme.palette.primary.dark,
  },
  barColorPrimary: {
    backgroundColor: theme.palette.primary.light,
  },
})

const ColorLinearProgress = withStyles(styles)(LinearProgress)

export default ColorLinearProgress